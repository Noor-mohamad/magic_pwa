import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useStyle } from '@magento/venia-ui/lib/classify';
import Image from '@magento/venia-ui/lib/components/Image';

import logoDark from './mooncart-logo.svg';
import logoLight from './mooncart-logo-white.svg';

/**
 * MoonCart theme logo override.
 *
 * Swaps Venia's default logo for the MoonCart theme's logo, with a
 * `variant` prop to pick the dark (default) or light/white mark used on
 * the transparent header before it becomes sticky.
 *
 * TODO: source this from `storeConfig.header_logo_src` once the logo
 * needs to be admin-manageable rather than a fixed theme asset.
 */
const Logo = props => {
    const { height, width, variant } = props;
    const classes = useStyle({}, props.classes);
    const { formatMessage } = useIntl();

    const title = formatMessage({ id: 'logo.title', defaultMessage: 'MoonCart' });
    const src = variant === 'light' ? logoLight : logoDark;

    return (
        <Image
            classes={{ image: classes.logo }}
            height={height}
            src={src}
            alt={title}
            title={title}
            width={width}
        />
    );
};

Logo.propTypes = {
    classes: PropTypes.shape({
        logo: PropTypes.string
    }),
    height: PropTypes.number,
    width: PropTypes.number,
    variant: PropTypes.oneOf(['dark', 'light'])
};

Logo.defaultProps = {
    height: 36,
    width: 150,
    variant: 'dark'
};

export default Logo;
