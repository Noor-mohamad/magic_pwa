import React from 'react';
import { gql, useQuery } from '@apollo/client';

import logoWhite from '../../../../../../src/moonCartTheme/images/logo-white.svg';
import { normalizeCmsHtml } from '../../../../../../src/moonCartTheme/normalizeCmsHtml';

const GET_FOOTER_BLOCKS = gql`
    query getFooterBlocks {
        cmsBlocks(identifiers: ["footer_instagram", "footer_menu", "footer_social"]) {
            items {
                identifier
                content
            }
        }
        storeConfig {
            store_code
            copyright
        }
    }
`;

/**
 * MoonCart theme Footer — mostly CMS-driven now.
 *
 * Faithful port of the MoonCart theme's own footer markup
 * (theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/index.html,
 * lines 1221-1355: <footer class="site-footer footer-dark style-3">).
 *
 * Three sections now come from CMS blocks via the `cmsBlocks` GraphQL
 * query, run through `normalizeCmsHtml` (undoes Page Builder's
 * HTML-escaping if a block was ever opened and re-saved through its
 * visual stage instead of "Edit HTML Code") and injected with
 * dangerouslySetInnerHTML (see scripts/create-footer-cms-blocks.php for
 * the content/setup):
 *   - footer_instagram : the image grid + "Share with #MoonCart" tile
 *   - footer_menu       : the Our Stores / Useful Links / Footer Menu columns
 *   - footer_social     : the Facebook/Twitter/LinkedIn/Instagram icons
 *
 * The copyright line is now live too, via `storeConfig.copyright`
 * (Admin > Content > Configuration > Footer > Copyright — see
 * scripts/set-footer-copyright.php for the initial placeholder value).
 * Only the logo stays as a fixed theme asset for now.
 */
const Footer = () => {
    const { data } = useQuery(GET_FOOTER_BLOCKS, {
        fetchPolicy: 'cache-and-network'
    });

    const blockContent = identifier =>
        normalizeCmsHtml(
            data?.cmsBlocks?.items?.find(item => item.identifier === identifier)
                ?.content
        );

    const copyrightText = data?.storeConfig?.copyright || '';

    return (
        <footer className="site-footer footer-dark style-3">
            {/* Footer Top */}
            <div className="container">
                <div className="row">
                    <div className="col-md-4 col-lg-4 col-md-12 px-0">
                        <div
                            className="row dz-post g-0 spno"
                            dangerouslySetInnerHTML={{
                                __html: blockContent('footer_instagram')
                            }}
                        />
                    </div>
                    <div className="col-md-8 col-lg-8 col-md-12">
                        <div className="footer-top">
                            <div className="dz-custom-container">
                                <div className="row align-items-center logo-topbar gx-0">
                                    <div className="col-12 col-sm-6">
                                        <div className="footer-logo logo-white mb-0">
                                            <a href="/">
                                                <img src={logoWhite} alt="" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <div
                                            className="dz-social-icon style-1"
                                            dangerouslySetInnerHTML={{
                                                __html: blockContent('footer_social')
                                            }}
                                        />
                                    </div>
                                </div>
                                <div
                                    className="row"
                                    dangerouslySetInnerHTML={{
                                        __html: blockContent('footer_menu')
                                    }}
                                />
                            </div>
                        </div>
                        {/* Footer Bottom */}
                        <div className="footer-bottom">
                            <div className="fb-inner">
                                <div className="text-center">
                                    <p className="copyright-text">{copyrightText}</p>
                                </div>
                            </div>
                        </div>
                        {/* Footer Bottom End */}
                    </div>
                </div>
            </div>
            {/* Footer Top End */}
        </footer>
    );
};

export default Footer;
