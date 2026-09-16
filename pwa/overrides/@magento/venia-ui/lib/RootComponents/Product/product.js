import React, { Fragment, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { string } from 'prop-types';
import { gql } from '@apollo/client';

import { useProduct } from '@magento/peregrine/lib/talons/RootComponents/Product/useProduct';
import ErrorView from '@magento/venia-ui/lib/components/ErrorView';
import { StoreTitle, Meta, Link } from '@magento/venia-ui/lib/components/Head';
import ProductShimmer from '@magento/venia-ui/lib/RootComponents/Product/product.shimmer';

import ProductDetail from '../../../../../../src/moonCartTheme/ProductDetail/ProductDetail';

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
 * Same fragment-swap fix already used for Header's cart badge and
 * ProductFullDetail's add-to-cart mutation: keep the real useProduct
 * talon (URL-key resolution, mapProduct, page-loading/eventing wiring
 * — all correct and unrelated to this bug) but hand it our own query
 * via its `operations` prop. `custom_attributes`/`ProductAttributeMetadata`
 * are dropped entirely; everything else below is the real, full data
 * the MoonCart PDP (ProductDetail.js) needs — configurable options,
 * variants (with their own real price/stock/images), related products,
 * and reviews — all in this one query rather than the multiple
 * follow-up queries Quick View needed (this is the primary page load,
 * not a modal opened from already-fetched card data).
 */
const RELATED_PRODUCT_FIELDS = gql`
    fragment MoonCartRelatedProductFields on ProductInterface {
        uid
        name
        sku
        url_key
        stock_status
        rating_summary
        __typename
        small_image {
            url
        }
        price_range {
            maximum_price {
                final_price {
                    value
                    currency
                }
                regular_price {
                    value
                    currency
                }
                discount {
                    amount_off
                }
            }
        }
    }
`;

const PRODUCT_DETAILS_FRAGMENT = gql`
    fragment MoonCartProductDetailsFragment on ProductInterface {
        __typename
        categories {
            uid
            name
        }
        description {
            html
        }
        short_description {
            html
        }
        id
        uid
        media_gallery {
            url
        }
        meta_description
        name
        price_range {
            maximum_price {
                final_price {
                    currency
                    value
                }
                regular_price {
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
        rating_summary
        review_count
        reviews(pageSize: 50) {
            items {
                nickname
                summary
                text
                created_at
                average_rating
            }
        }
        related_products {
            ...MoonCartRelatedProductFields
        }
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
                    sku
                    stock_status
                    media_gallery {
                        url
                    }
                    price_range {
                        maximum_price {
                            final_price {
                                currency
                                value
                            }
                            regular_price {
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
    ${RELATED_PRODUCT_FIELDS}
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

// venia-ui's own mapProduct util flattens `description`/`small_image`
// from their real `{ html }`/`{ url }` object shapes into plain
// strings, for backwards compatibility with stock <ProductFullDetail>
// (which this project no longer renders — see ProductDetail.js).
// ProductDetail.js expects the real object shapes (same as every
// other component in this project — QuickViewModal.js, category
// cards, ...), so this is a plain passthrough instead, not
// venia-ui's mapProduct.
//
// It also adds the same two shims QuickViewModal.js needs:
// useProductFullDetail spreads both `variant.product.custom_attributes`
// AND `variant.product.media_gallery_entries` with no guard once
// options are selected. Neither is requested above
// (custom_attributes doesn't exist in this schema at all — see the
// big comment above; media_gallery_entries is simply not requested
// since ProductDetail.js renders its own gallery from `media_gallery`
// instead), so both are shimmed to an empty array here.
const mapProductWithSafeShims = rawProduct => {
    const mapped = { ...rawProduct };
    return {
        ...mapped,
        custom_attributes: [],
        media_gallery_entries: [],
        variants: (mapped.variants || []).map(variant => ({
            ...variant,
            product: {
                ...variant.product,
                custom_attributes: [],
                media_gallery_entries: []
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
            {/*
                key={product.uid}: forces a fresh mount (and so, fresh
                internal talon state) on every product navigation —
                see ProductDetail.js's own doc comment for why that
                matters for useProductFullDetail specifically.
            */}
            <ProductDetail key={product.uid} product={product} />
        </Fragment>
    );
};

Product.propTypes = {
    __typename: string.isRequired
};

export default Product;
