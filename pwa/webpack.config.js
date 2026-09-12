const { configureWebpack, graphQL } = require('@magento/pwa-buildpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const {
    getMediaURL,
    getStoreConfigData,
    getAvailableStoresConfigData,
    getPossibleTypes
} = graphQL;

const { DefinePlugin } = webpack;
// const { LimitChunkCountPlugin } = webpack.optimize;

const getCleanTemplate = templateFile => {
    return new Promise(resolve => {
        fs.readFile(templateFile, 'utf8', (err, data) => {
            resolve(
                data.replace(
                    /(?<inlineddata><!-- Inlined Data -->.*\s<!-- \/Inlined Data -->)/gs,
                    ''
                )
            );
        });
    });
};

module.exports = async env => {
    /**
     * configureWebpack() returns a regular Webpack configuration object.
     * You can customize the build by mutating the object here, as in
     * this example. Since it's a regular Webpack configuration, the object
     * supports the `module.noParse` option in Webpack, documented here:
     * https://webpack.js.org/configuration/module/#modulenoparse
     */
    const config = await configureWebpack({
        context: __dirname,
        vendor: [
            '@apollo/client',
            'apollo-cache-persist',
            'informed',
            'react',
            'react-dom',
            'react-feather',
            'react-redux',
            'react-router-dom',
            'redux',
            'redux-actions',
            'redux-thunk'
        ],
        special: {
            'react-feather': {
                esModules: true
            }
        },
        env
    });

    const mediaUrl = await getMediaURL();
    const storeConfigData = await getStoreConfigData();
    const { availableStores } = await getAvailableStoresConfigData();
    const writeFile = promisify(fs.writeFile);

    /**
     * Loop the available stores when there is provided STORE_VIEW_CODE
     * in the .env file, because should set the store name from the
     * given store code instead of the default one.
     */
    const availableStore = availableStores.find(
        ({ store_code }) => store_code === process.env.STORE_VIEW_CODE
    );

    /**
     * Here we check the STORE_VIEW_CODE for multistore setup and generate
     * the index.html content to have the store code in script url
     * and placed the assets in storeview specific folder inside dist
     */
    if (process.env.USE_STORE_CODE_IN_URL && process.env.STORE_VIEW_CODE) {
        const storeViewCode = process.env.STORE_VIEW_CODE;
        config.output = {
            ...config.output,
            publicPath: `/${storeViewCode}/`,
            path: path.resolve(__dirname, 'dist', storeViewCode)
        };
    }

    global.MAGENTO_MEDIA_BACKEND_URL = mediaUrl;
    global.LOCALE = storeConfigData.locale.replace('_', '-');
    global.AVAILABLE_STORE_VIEWS = availableStores;

    const possibleTypes = await getPossibleTypes();

    const htmlWebpackConfig = {
        filename: 'index.html',
        minify: {
            collapseWhitespace: true,
            removeComments: true
        }
    };

    // Strip UPWARD mustache from template file during watch
    if (
        process.env.npm_lifecycle_event &&
        process.env.npm_lifecycle_event.includes('watch')
    ) {
        const devTemplate = await getCleanTemplate('./template.html');

        // Generate new gitignored html file based on the cleaned template
        await writeFile('template.generated.html', devTemplate);
        htmlWebpackConfig.template = './template.generated.html';
    } else {
        htmlWebpackConfig.template = './template.html';
    }

    config.module.noParse = [
        /@adobe\/adobe\-client\-data\-layer/,
        /braintree\-web\-drop\-in/
    ];

    // Buildpack's default rules only file-load gif/jpg/png/svg — the
    // MoonCart theme's icon fonts (FontAwesome, Flaticon) need woff/
    // woff2/ttf/eot handled too, or css-loader chokes on their @font-face
    // url()s.
    config.module.rules.push({
        test: /\.(woff2?|ttf|eot)(\?.*)?$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: '[name]-[hash:base58:3].[ext]'
                }
            }
        ]
    });

    // Add extension directories to the babel-loader include paths
    const jsRule = config.module.rules.find(
        rule => rule.test && rule.test.toString().includes('jsx')
    );
    if (jsRule && jsRule.include) {
        const extensionsPath = path.resolve(__dirname, '../extensions');
        if (!jsRule.include.includes(extensionsPath)) {
            jsRule.include.push(extensionsPath);
        }

        // Add overrides directory to babel-loader include paths
        const overridesPath = path.resolve(__dirname, './overrides');
        if (!jsRule.include.includes(overridesPath)) {
            jsRule.include.push(overridesPath);
        }
    }

    // MoonCart theme overrides (see /overrides/@magento/venia-ui/...)
    if (!config.resolve) {
        config.resolve = {};
    }
    if (!config.resolve.alias) {
        config.resolve.alias = {};
    }

    // Whole-component overrides — the trailing "$" makes these EXACT
    // matches, so only the bare package-relative specifier itself
    // ('@magento/venia-ui/lib/components/Header', used to reach its
    // index.js) is redirected. Without "$" webpack's alias also rewrites
    // every longer path that starts with it (e.g. .../Header/cartTrigger),
    // which would break our own override importing Header's real
    // subcomponents from the original package.
    config.resolve.alias[
        '@magento/venia-ui/lib/components/Header$'
    ] = path.resolve(
        __dirname,
        './overrides/@magento/venia-ui/lib/components/Header'
    );
    config.resolve.alias[
        '@magento/venia-ui/lib/components/Logo$'
    ] = path.resolve(__dirname, './overrides/@magento/venia-ui/lib/components/Logo');
    config.resolve.alias[
        '@magento/venia-ui/lib/components/Footer$'
    ] = path.resolve(
        __dirname,
        './overrides/@magento/venia-ui/lib/components/Footer'
    );

    const overrideHeaderPath = path.resolve(
        __dirname,
        './overrides/@magento/venia-ui/lib/components/Header/index.js'
    );
    const overrideFooterPath = path.resolve(
        __dirname,
        './overrides/@magento/venia-ui/lib/components/Footer/index.js'
    );

    config.plugins = [
        ...config.plugins,
        // Intercept venia-ui's relative import of Header (import Header from '../Header')
        // inside Main component. The alias above only catches absolute imports;
        // this plugin catches the relative one that Main actually uses.
        new webpack.NormalModuleReplacementPlugin(/^\.\.\/Header$/, resource => {
            if (
                resource.context &&
                resource.context.includes('@magento/venia-ui/lib/components/Main')
            ) {
                resource.request = overrideHeaderPath;
            }
        }),
        // Same technique for venia-ui's relative import of Footer inside Main.
        new webpack.NormalModuleReplacementPlugin(/^\.\.\/Footer$/, resource => {
            if (
                resource.context &&
                resource.context.includes('@magento/venia-ui/lib/components/Main')
            ) {
                resource.request = overrideFooterPath;
            }
        }),
        new DefinePlugin({
            /**
             * Make sure to add the same constants to
             * the globals object in jest.config.js.
             */
            POSSIBLE_TYPES: JSON.stringify(possibleTypes),
            STORE_NAME: availableStore
                ? JSON.stringify(availableStore.store_name)
                : JSON.stringify(storeConfigData.store_name),
            STORE_VIEW_CODE: process.env.STORE_VIEW_CODE
                ? JSON.stringify(process.env.STORE_VIEW_CODE)
                : JSON.stringify(storeConfigData.code),
            AVAILABLE_STORE_VIEWS: JSON.stringify(availableStores),
            DEFAULT_LOCALE: JSON.stringify(global.LOCALE),
            DEFAULT_COUNTRY_CODE: JSON.stringify(
                process.env.DEFAULT_COUNTRY_CODE || 'US'
            ),
            __DEV__: process.env.NODE_ENV !== 'production'
        }),
        new HTMLWebpackPlugin(htmlWebpackConfig)
    ];

    /*
    Commenting out this section until SSR is fully implemented
    */
    // const serverConfig = Object.assign({}, config, {
    //     target: 'node',
    //     devtool: false,
    //     module: { ...config.module },
    //     name: 'server-config',
    //     output: {
    //         ...config.output,
    //         filename: '[name].[hash].SERVER.js',
    //         strictModuleExceptionHandling: true
    //     },
    //     optimization: {
    //         minimize: false
    //     },
    //     plugins: [...config.plugins]
    // });

    // TODO: get LocalizationPlugin working in Node
    // const browserPlugins = new Set()
    //     .add('HtmlWebpackPlugin')
    //     .add('LocalizationPlugin')
    //     .add('ServiceWorkerPlugin')
    //     .add('VirtualModulesPlugin')
    //     .add('WebpackAssetsManifest');

    // remove browser-only plugins
    // serverConfig.plugins = serverConfig.plugins.filter(
    //     plugin => !browserPlugins.has(plugin.constructor.name)
    // );

    // remove browser-only module rules
    // serverConfig.module.rules = serverConfig.module.rules.map(rule => {
    //     if (`${rule.test}` === '/\\.css$/') {
    //         return {
    //             ...rule,
    //             oneOf: rule.oneOf.map(ruleConfig => ({
    //                 ...ruleConfig,
    //                 use: ruleConfig.use.filter(
    //                     loaderConfig => loaderConfig.loader !== 'style-loader'
    //                 )
    //             }))
    //         };
    //     }

    //     return rule;
    // });

    // add LimitChunkCountPlugin to avoid code splitting
    // serverConfig.plugins.push(
    //     new LimitChunkCountPlugin({
    //         maxChunks: 1
    //     })
    // );

    return [config];
};
