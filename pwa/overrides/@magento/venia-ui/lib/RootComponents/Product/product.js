import React, { Fragment, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { string } from 'prop-types';
import { gql } from '@apollo/client';

import { useProduct } from '@magento/peregrine/lib/talons/RootComponents/Product/useProduct';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { StoreTitle, Meta, Link } from '@magento/venia-ui/lib/components/Head';
import ProductFullDetail from '@magento/venia-ui/lib/components/ProductFullDetail';
import mapProduct from '@magento/venia-ui/lib/util/mapProduct';
import ProductShimmer from '@magento/venia-ui/lib/RootComponents/Product/product.shimmer';

/**
 * Stock venia-ui's own product.js pulls in Peregrine's
 * ProductDetailsFragment (RootComponents/Product/productDetailFragment.
 * gql.js), which queries `custom_attributes` (a field this Magento
 * version's installed schema renamed to `custom_attributesV2` — same
 * gotcha already hit and documented in QuickViewModal.js/useCompareList
 * .js) AND an inline fragment `... on ProductAttributeMetadata`, a type
 * this schema doesn't declare *at all*. That second one is worse than a
 * normal "cannot query field" error: an unknown TYPE reference makes
 * Magento's own schema-config lookup throw a raw LogicException
 * ("Config element … is not declared in GraphQL schema") during query
 * validation, before any resolver even runs — every PDP visit 500s
 * server-side (see var/log/exception.log) rather than returning a
 * normal GraphQL error response.
 *
 * This is the same fragment-swap fix already used for Header's cart
 * badge and ProductFullDetail's add-to-cart mutation: keep the real
 * useProduct talon (URL-key resolution, mapProduct, page-loading/
 * eventing wiring — all correct and unrelated to this bug) but hand it
 * our own query via its `operations` prop, with `custom_attributes`
 * (and the broken inline fragment inside it) simply dropped. Every
 * other field below is copied verbatim from Peregrine's own fragment.
 *
 * This still renders stock venia-ui's own <ProductFullDetail> —
 * unstyled/un-rebranded. The MoonCart-themed PDP is a separate,
 * follow-up piece of work.
 */
const PRODUCT_DETAILS_FRAGMENT = gql`
    fragment MoonCartProductDetailsFragment on ProductInterface {
        __typename
        categories {
            uid
            breadcrumbs {
                category_uid
            }
        }
        description {
            html
        }
        short_description {
            html
        }
        id
        uid
        media_gallery_entries {
            uid
            label
            position
            disabled
            file
        }
        meta_description
        name
        price {
            regularPrice {
                amount {
                    currency
                    value
                }
            }
        }
        price_range {
            maximum_price {
                final_price {
                    currency
                    value
                }
                discount {
                    amount_off
                }
            }
        }
        sku
        small_image {
            url
        }
        stock_status
        url_key
        ... on ConfigurableProduct {
            configurable_options {
                attribute_code
                attribute_id
                uid
                label
                values {
                    uid
                    default_label
                    label
                    store_label
                    use_default_value
                    value_index
                    swatch_data {
                        ... on ImageSwatchData {
                            thumbnail
                        }
                        value
                    }
                }
            }
            variants {
                attributes {
                    code
                    value_index
                }
                product {
                    uid
                    media_gallery_entries {
                        uid
                        disabled
                        file
                        label
                        position
                    }
                    sku
                    stock_status
                    price {
                        regularPrice {
                            amount {
                                currency
                                value
                            }
                        }
                    }
                    price_range {
                        maximum_price {
                            final_price {
                                currency
                                value
                            }
                            discount {
                                amount_off
                            }
                        }
                    }
                }
            }
        }
    }
`;

const GET_PRODUCT_DETAIL_QUERY = gql`
    query moonCartGetProductDetailForProductPage($urlKey: String!) {
        products(filter: { url_key: { eq: $urlKey } }) {
            items {
                id
                uid
                ...MoonCartProductDetailsFragment
            }
        }
    }
    ${PRODUCT_DETAILS_FRAGMENT}
`;

// venia-ui's own <ProductFullDetail> (below) uses
// useProductFullDetail, which — for a configurable product, once
// options are selected — spreads `variant.product.custom_attributes`
// with no guard. Since that field isn't requested above (it doesn't
// exist in this schema at all — see the big comment above), it would
// be `undefined` there and crash on the first option pick. Same
// defensive shim already used in QuickViewModal.js/useCompareList.js.
const mapProductWithSafeShims = rawProduct => {
    const mapped = mapProduct(rawProduct);
    return {
        ...mapped,
        custom_attributes: [],
        variants: (mapped.variants || []).map(variant => ({
            ...variant,
            product: {
                ...variant.product,
                custom_attributes: []
            }
        }))
    };
};

const Product = props => {
    const { __typename: productType } = props;
    const talonProps = useProduct({
        mapProduct: mapProductWithSafeShims,
        operations: { getProductDetailQuery: GET_PRODUCT_DETAIL_QUERY }
    });

    const { error, loading, product, storeConfig } = talonProps;

    const canonicalUrl = useMemo(() => {
        if (!product || !storeConfig?.product_canonical_tag) return null;

        const origin =
            typeof window !== 'undefined' ? window.location.origin : '';
        const suffix = storeConfig?.product_url_suffix || '';

        return `${origin}/${product.url_key}${suffix}`;
    }, [product, storeConfig]);

    if (loading && !product)
        return <ProductShimmer productType={productType} />;
    if (error && !product) return <ErrorView />;
    if (!product) {
        return (
            <h1>
                <FormattedMessage
                    id={'product.outOfStockTryAgain'}
                    defaultMessage={
                        'This Product is currently out of stock. Please try again later.'
                    }
                />
            </h1>
        );
    }

    return (
        <Fragment>
            <StoreTitle>{product.name}</StoreTitle>
            <Meta name="description" content={product.meta_description} />
            {canonicalUrl && <Link rel="canonical" href={canonicalUrl} />}
            <ProductFullDetail product={product} />
        </Fragment>
    );
};

Product.propTypes = {
    __typename: string.isRequired
};

export default Product;
