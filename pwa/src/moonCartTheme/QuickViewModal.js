import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { gql, useMutation, useQuery } from '@apollo/client';

import { useProductFullDetail } from '@magento/peregrine/lib/talons/ProductFullDetail/useProductFullDetail';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useAwaitQuery } from '@magento/peregrine/lib/hooks/useAwaitQuery';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import Price from '@magento/venia-ui/lib/components/Price';

import inlinePriceClasses from './inlinePriceClasses';
import { normalizeCmsHtml } from './normalizeCmsHtml';

const STAR_PATH =
    'M7.24805 0.734375L9.22301 5.01608L13.9054 5.57126L10.4436 8.77267L11.3625 13.3975L7.24805 11.0944L3.13355 13.3975L4.0525 8.77267L0.590651 5.57126L5.27309 5.01608L7.24805 0.734375Z';

const Star = ({ filled }) => (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={STAR_PATH} fill={filled ? '#FF8A00' : '#5E626F'} opacity={filled ? 1 : 0.2} />
    </svg>
);

// Extra detail Quick View needs beyond what category.js's product list
// query already fetched (see the `product` prop this component
// receives) — a separate, small lookup by sku rather than widening
// that list query for every card just for the rare Quick View open.
// Includes real configurable options (color/size/...) + their real
// variants, so the same option-picking + add-to-cart flow the real
// PDP has is available here too.
const GET_QUICK_VIEW_DETAIL = gql`
    query getMoonCartQuickViewDetail($sku: String!) {
        products(filter: { sku: { eq: $sku } }) {
            items {
                uid
                sku
                media_gallery {
                    url
                }
                short_description {
                    html
                }
                description {
                    html
                }
                categories {
                    uid
                    name
                }
                review_count
                ... on ConfigurableProduct {
                    configurable_options {
                        uid
                        attribute_id
                        attribute_code
                        label
                        position
                        values {
                            value_index
                            uid
                            label
                            swatch_data {
                                value
                            }
                        }
                    }
                    variants {
                        attributes {
                            code
                            value_index
                            uid
                        }
                        product {
                            id
                            uid
                            sku
                            stock_status
                            media_gallery {
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
                    }
                }
            }
        }
    }
`;

// Peregrine's own default add-to-cart mutation (the one
// useProductFullDetail's own handleAddToCart calls internally) spreads
// a `CartTriggerFragment` that requests
// `total_summary_quantity_including_config` — a field this Magento
// instance's installed schema doesn't have at all (a real version
// mismatch between the vendored Peregrine package and this store's
// GraphQL modules), which makes the whole mutation error out with no
// data. It also swallows its own errors internally (a bare `catch {
// return; }`), so there's no way to surface success/failure to the
// user through it either. This is the same real, recommended
// `addProductsToCart` mutation, called directly here instead — it
// only asks for `total_quantity` on the returned cart — the same
// field our own Header's cart badge reads (see header.js) — so the
// badge still updates correctly via Apollo's normalized cache, and it
// surfaces `user_errors` so a real failure can be shown rather than
// silently dropped. useProductFullDetail is still used for
// `handleSelectionChange`/`isAddToCartDisabled` (real, already-correct
// variant/stock validation) — just not for the mutation itself.
const ADD_PRODUCT_TO_CART = gql`
    mutation moonCartQuickViewAddProductToCart($cartId: String!, $product: CartItemInput!) {
        addProductsToCart(cartId: $cartId, cartItems: [$product]) {
            cart {
                id
                total_quantity
            }
            user_errors {
                code
                message
            }
        }
    }
`;

const CREATE_CART_MUTATION = gql`
    mutation moonCartQuickViewCreateCart {
        cartId: createEmptyCart
    }
`;

const CART_DETAILS_QUERY = gql`
    query moonCartQuickViewCheckUserIsAuthed($cartId: String!) {
        cart(cart_id: $cartId) {
            id
        }
    }
`;

const modalShellStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto'
};

/**
 * Theme port of shop-standard.html's "#exampleModal" ("Quick Modal").
 *
 * This outer component only decides WHEN the real modal
 * (QuickViewModalContent, below) is safe to mount — see the big
 * comment on `detailReady` for why that gating exists — plus renders
 * a lightweight loading shell in the meantime. All the real behavior
 * lives in QuickViewModalContent.
 */
const QuickViewModal = ({
    product,
    onClose,
    isWishlisted,
    onToggleWishlist,
    isInCompare,
    onToggleCompare
}) => {
    const { data } = useQuery(GET_QUICK_VIEW_DETAIL, {
        variables: { sku: product?.sku },
        skip: !product?.sku,
        fetchPolicy: 'cache-and-network'
    });
    const detail = data?.products?.items?.[0];

    if (!product) return null;

    // The query above is what actually loads configurable_options/
    // variants — until it resolves for THIS product, `product` (from
    // the card) already says __typename: 'ConfigurableProduct' but
    // carries none of that data yet. Peregrine's `useProductFullDetail`
    // captures its internal option-code map via a one-time `useState`
    // initializer (it assumes, correctly for the real PDP, that the
    // full product is already known on first render) — so if that
    // talon is ever first invoked with an incomplete configurable
    // product, its option/variant matching stays permanently broken
    // for the rest of that component instance's life, even after the
    // real data arrives. Gating the mount here — and giving
    // QuickViewModalContent a `key` — guarantees the talon's first-ever
    // render, for every product, already has complete data.
    const isConfigurable = product.__typename === 'ConfigurableProduct';
    const detailReady = !isConfigurable || detail?.sku === product.sku;

    if (!detailReady) {
        return (
            <>
                <div
                    className="modal quick-view-modal fade show"
                    style={modalShellStyle}
                    tabIndex={-1}
                    role="dialog"
                    onClick={e => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ minHeight: 200 }}>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={onClose}
                            >
                                <i className="icon feather icon-x" />
                            </button>
                            <div
                                className="modal-body d-flex align-items-center justify-content-center"
                                style={{ minHeight: 200 }}
                            >
                                <span className="text-muted">Loading…</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-backdrop fade show" onClick={onClose} />
            </>
        );
    }

    return (
        <QuickViewModalContent
            key={product.sku}
            product={product}
            detail={detail}
            onClose={onClose}
            isWishlisted={isWishlisted}
            onToggleWishlist={onToggleWishlist}
            isInCompare={isInCompare}
            onToggleCompare={onToggleCompare}
        />
    );
};

/**
 * The real Quick View — only ever mounted once `product` + `detail`
 * (for configurable products) are both already loaded (see above), so
 * every hook here — including Peregrine's own `useProductFullDetail` —
 * gets correct data on its very first render.
 *
 * Configurable-product option selection and Add To Cart both reuse
 * Peregrine's own `useProductFullDetail` — the exact talon the real
 * PDP (ProductFullDetail) uses — rather than reimplementing variant
 * matching / cart mutation building. Two small client-side shims are
 * needed to make that safe here:
 *  - `custom_attributes: []` on the product and every variant's
 *    product — this Magento version renamed that field to
 *    `custom_attributesV2`, so the old field the talon reads doesn't
 *    exist in this schema at all; without the shim, an internal
 *    (unused-by-us) computation the talon always runs would crash the
 *    moment a variant is matched.
 *  - `media_gallery_entries: []` similarly — we render our own
 *    gallery from `media_gallery` (see below) rather than the raw,
 *    URL-less entries the talon's own image logic expects.
 * Which specific value is picked per option (for highlighting the
 * active swatch/pill, and for showing that variant's own price/
 * images) is tracked locally here — the talon's own selection state
 * isn't exposed in its return value, matching how Venia's real
 * Option/SwatchList components also keep local selection state
 * alongside it.
 *
 * Simplifications vs. the theme's own markup:
 *  - Image gallery is a plain click-to-swap thumbnail strip, not the
 *    Swiper carousel (Swiper isn't ported into this project).
 *  - Quantity stepper is a plain +/- + number input, not the
 *    bootstrap-touchspin plugin (not ported either) — real and
 *    functional, just not pixel-identical to the theme's widget.
 *  - The theme's own Quick View demo never included configurable
 *    options (its example product is a simple product), so there's no
 *    exact markup to port for the option swatches/pills — styled to
 *    match the category sidebar's own Color/Size widgets instead, for
 *    visual consistency.
 *  - "Tags" from the theme's info list is dropped — no Magento
 *    equivalent (same decision as the category sidebar's Tags cloud).
 *
 * Wishlist and Compare state are passed in as props rather than
 * queried again here — categoryContent.js already owns both (same
 * convention the card components use).
 */
const QuickViewModalContent = ({
    product,
    detail,
    onClose,
    isWishlisted,
    onToggleWishlist,
    isInCompare,
    onToggleCompare
}) => {
    const history = useHistory();
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedByAttributeCode, setSelectedByAttributeCode] = useState({});
    // null while no attempt has finished yet this session; 'success' or
    // 'error' once handleAddToCartClick settles, so the outcome (and,
    // on success, a real link to /cart) can be shown.
    const [addStatus, setAddStatus] = useState(null);
    const [addErrorMessage, setAddErrorMessage] = useState('');

    const [cartState, cartApi] = useCartContext();
    const { cartId } = cartState;
    const [addProductToCart] = useMutation(ADD_PRODUCT_TO_CART);
    const [fetchCartId] = useMutation(CREATE_CART_MUTATION);
    const fetchCartDetails = useAwaitQuery(CART_DETAILS_QUERY);

    const ensureCartId = async () => {
        let newCartId = cartId;
        if (!newCartId) {
            await cartApi.getCartDetails({ fetchCartId, fetchCartDetails });
            newCartId = new BrowserPersistence().getItem('cartId');
            if (!newCartId) throw new Error('Failed to create a new cart');
        }
        return newCartId;
    };

    const configurableOptions = useMemo(
        () =>
            [...(detail?.configurable_options || [])].sort(
                (a, b) => (a.position || 0) - (b.position || 0)
            ),
        [detail]
    );
    const variants = detail?.variants || [];

    const isConfigurable = product.__typename === 'ConfigurableProduct';

    const fullProduct = useMemo(
        () => ({
            ...product,
            categories: detail?.categories || [],
            custom_attributes: [],
            media_gallery_entries: [],
            configurable_options: configurableOptions,
            variants: variants.map(variant => ({
                ...variant,
                product: {
                    ...variant.product,
                    custom_attributes: [],
                    media_gallery_entries: []
                }
            }))
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [product, detail, configurableOptions, variants]
    );

    const { handleSelectionChange, isAddToCartDisabled } = useProductFullDetail({
        product: fullProduct
    });

    const isMissingOptions =
        isConfigurable &&
        configurableOptions.some(
            option => selectedByAttributeCode[option.attribute_code] == null
        );

    const matchedVariant = useMemo(() => {
        if (!isConfigurable || isMissingOptions) return null;
        return (
            variants.find(variant =>
                variant.attributes.every(
                    attribute =>
                        String(selectedByAttributeCode[attribute.code]) ===
                        String(attribute.value_index)
                )
            ) || null
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variants, selectedByAttributeCode, isConfigurable, isMissingOptions]);

    const { name, price_range, rating_summary, small_image, url_key, sku } = product;

    const displayPriceRange = matchedVariant
        ? matchedVariant.product.price_range
        : price_range;
    const finalPrice = displayPriceRange.maximum_price.final_price;
    const regularPrice = displayPriceRange.maximum_price.regular_price;
    const discount = displayPriceRange.maximum_price.discount;
    const hasDiscount = discount?.amount_off > 0;

    const productUrl = `/${url_key}.html`;

    const variantImages = matchedVariant?.product?.media_gallery?.map(m => m.url) || [];
    const images = variantImages.length
        ? variantImages
        : detail?.media_gallery?.length
        ? detail.media_gallery.map(m => m.url)
        : small_image?.url
        ? [small_image.url]
        : [];

    const descriptionHtml = detail?.short_description?.html || detail?.description?.html;
    const categories = detail?.categories || [];
    const filledStars = rating_summary ? Math.round((rating_summary / 100) * 5) : 0;

    const goToProduct = e => {
        if (e) e.preventDefault();
        onClose();
        history.push(productUrl);
    };

    const handleOptionSelect = (option, value) => {
        // Peregrine's own selection map is keyed by attribute_id (what
        // the real PDP's Option components pass) — our own copy (for
        // highlighting + the price/image lookups above) is keyed by
        // attribute_code, which is what a variant's own `attributes`
        // array carries.
        handleSelectionChange(option.attribute_id, value.value_index);
        setSelectedByAttributeCode(prev => ({
            ...prev,
            [option.attribute_code]: value.value_index
        }));
        setActiveImageIndex(0);
        // A new selection makes any earlier success/error message stale.
        setAddStatus(null);
    };

    const handleAddToCartClick = async () => {
        setIsAdding(true);
        setAddStatus(null);
        try {
            const newCartId = await ensureCartId();

            const productInput = { sku, quantity };
            if (isConfigurable) {
                const selectedOptionUids = configurableOptions
                    .map(
                        option =>
                            option.values.find(
                                value =>
                                    value.value_index ===
                                    selectedByAttributeCode[option.attribute_code]
                            )?.uid
                    )
                    .filter(Boolean);
                productInput.selected_options = selectedOptionUids;
            }

            const { data } = await addProductToCart({
                variables: { cartId: newCartId, product: productInput }
            });

            const userErrors = data?.addProductsToCart?.user_errors || [];
            if (userErrors.length) {
                throw new Error(userErrors[0].message);
            }

            setAddStatus('success');
        } catch (e) {
            setAddStatus('error');
            setAddErrorMessage(
                e?.message || 'Something went wrong adding this to your cart. Please try again.'
            );
        } finally {
            setIsAdding(false);
        }
    };

    const addToCartLabel = isMissingOptions
        ? 'Select Options'
        : isAddToCartDisabled
        ? isAdding
            ? 'Adding…'
            : 'Out of Stock'
        : isAdding
        ? 'Adding…'
        : 'Add To Cart';

    return (
        <>
            <div
                className="modal quick-view-modal fade show"
                style={modalShellStyle}
                tabIndex={-1}
                role="dialog"
                onClick={e => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={onClose}
                        >
                            <i className="icon feather icon-x" />
                        </button>
                        <div className="modal-body">
                            <div className="row g-xl-4 g-3">
                                <div className="col-xl-6 col-md-6">
                                    <div className="dz-product-detail mb-0">
                                        <div className="dz-media" style={{ height: 'auto' }}>
                                            <img
                                                src={images[activeImageIndex] || small_image?.url}
                                                alt={name}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1 / 1',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>
                                        {images.length > 1 && (
                                            <div
                                                className="d-flex flex-wrap mt-3"
                                                style={{ gap: 8 }}
                                            >
                                                {images.map((url, index) => (
                                                    <button
                                                        key={url + index}
                                                        type="button"
                                                        onClick={() => setActiveImageIndex(index)}
                                                        style={{
                                                            padding: 0,
                                                            border:
                                                                index === activeImageIndex
                                                                    ? '2px solid var(--primary)'
                                                                    : '1px solid #e1e1e1',
                                                            width: 60,
                                                            height: 60,
                                                            background: 'none'
                                                        }}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt=""
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-xl-6 col-md-6">
                                    <div className="dz-product-detail style-2 ps-xl-3 ps-0 pt-2 mb-0">
                                        <div className="dz-content">
                                            <div className="dz-content-footer">
                                                <div className="dz-content-start">
                                                    {hasDiscount && (
                                                        <span className="badge bg-purple mb-2">
                                                            SALE {Math.round(discount.amount_off)}
                                                            % Off
                                                        </span>
                                                    )}
                                                    <h4 className="title mb-1">
                                                        <a href={productUrl} onClick={goToProduct}>
                                                            {name}
                                                        </a>
                                                    </h4>
                                                    <div className="review-num">
                                                        {rating_summary ? (
                                                            <>
                                                                <ul className="dz-rating me-2">
                                                                    {[0, 1, 2, 3, 4].map(i => (
                                                                        <li key={i}>
                                                                            <Star filled={i < filledStars} />
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <span className="text-secondary me-2">
                                                                    {(rating_summary / 20).toFixed(1)} Rating
                                                                </span>
                                                                {detail?.review_count != null && (
                                                                    <span>
                                                                        ({detail.review_count} customer
                                                                        review
                                                                        {detail.review_count === 1 ? '' : 's'})
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">No reviews yet</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {descriptionHtml && (
                                                <div
                                                    className="para-text"
                                                    dangerouslySetInnerHTML={{
                                                        __html: normalizeCmsHtml(descriptionHtml)
                                                    }}
                                                />
                                            )}

                                            {configurableOptions.map(option => (
                                                <div className="widget mb-3" key={option.uid}>
                                                    <h6 className="widget-title">{option.label}</h6>
                                                    {option.attribute_code === 'color' ? (
                                                        <div className="d-flex align-items-center flex-wrap color-filter ps-2">
                                                            {option.values.map(value => {
                                                                const hex = value.swatch_data?.value;
                                                                const active =
                                                                    selectedByAttributeCode[
                                                                        option.attribute_code
                                                                    ] === value.value_index;
                                                                return (
                                                                    <div
                                                                        className="form-check"
                                                                        key={value.uid}
                                                                        title={value.label}
                                                                    >
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="radio"
                                                                            name={`quickview-${option.uid}`}
                                                                            checked={active}
                                                                            onChange={() =>
                                                                                handleOptionSelect(
                                                                                    option,
                                                                                    value
                                                                                )
                                                                            }
                                                                            aria-label={value.label}
                                                                        />
                                                                        <span
                                                                            style={{
                                                                                backgroundColor:
                                                                                    hex || '#D7D7D7',
                                                                                border: hex
                                                                                    ? undefined
                                                                                    : '1px solid #bbb'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="d-flex align-items-center flex-wrap"
                                                            style={{ gap: 8 }}
                                                        >
                                                            {option.values.map(value => {
                                                                const active =
                                                                    selectedByAttributeCode[
                                                                        option.attribute_code
                                                                    ] === value.value_index;
                                                                return (
                                                                    <button
                                                                        key={value.uid}
                                                                        type="button"
                                                                        className={
                                                                            'btn btn-sm ' +
                                                                            (active
                                                                                ? 'btn-secondary'
                                                                                : 'btn-outline-secondary')
                                                                        }
                                                                        onClick={() =>
                                                                            handleOptionSelect(option, value)
                                                                        }
                                                                    >
                                                                        {value.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="meta-content m-b20 d-flex align-items-end">
                                                <div className="me-3">
                                                    <span className="form-label">Price</span>
                                                    <span className="price-num">
                                                        <Price
                                                            value={finalPrice.value}
                                                            currencyCode={finalPrice.currency}
                                                            classes={inlinePriceClasses}
                                                        />
                                                        {hasDiscount && (
                                                            <del className="ms-2">
                                                                <Price
                                                                    value={regularPrice.value}
                                                                    currencyCode={regularPrice.currency}
                                                                    classes={inlinePriceClasses}
                                                                />
                                                            </del>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="btn-quantity light me-0">
                                                    <label className="form-label">Quantity</label>
                                                    <div
                                                        className="d-flex align-items-center"
                                                        style={{ gap: 4 }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() =>
                                                                setQuantity(q => Math.max(1, q - 1))
                                                            }
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={quantity}
                                                            onChange={e =>
                                                                setQuantity(
                                                                    Math.max(
                                                                        1,
                                                                        parseInt(e.target.value, 10) || 1
                                                                    )
                                                                )
                                                            }
                                                            style={{ width: 50, textAlign: 'center' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => setQuantity(q => q + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {addStatus === 'success' && (
                                                <div className="alert alert-success d-flex align-items-center justify-content-between">
                                                    <span>Added to your cart.</span>
                                                    <a
                                                        href="/cart"
                                                        className="alert-link"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            onClose();
                                                            history.push('/cart');
                                                        }}
                                                    >
                                                        View Cart
                                                    </a>
                                                </div>
                                            )}
                                            {addStatus === 'error' && (
                                                <div className="alert alert-danger">
                                                    {addErrorMessage}
                                                </div>
                                            )}
                                            <div className="btn-group cart-btn">
                                                <button
                                                    type="button"
                                                    className="btn btn-md btn-secondary text-uppercase"
                                                    onClick={handleAddToCartClick}
                                                    disabled={isAdding || isAddToCartDisabled}
                                                >
                                                    {addToCartLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={
                                                        'btn btn-md btn-light btn-icon' +
                                                        (isWishlisted ? ' active' : '')
                                                    }
                                                    onClick={onToggleWishlist}
                                                >
                                                    <i
                                                        className="icon feather icon-heart"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                    {isWishlisted ? 'In Wishlist' : 'Add To Wishlist'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={
                                                        'btn btn-md btn-light btn-icon' +
                                                        (isInCompare ? ' active' : '')
                                                    }
                                                    onClick={onToggleCompare}
                                                >
                                                    <i
                                                        className="icon feather icon-repeat"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                    {isInCompare ? 'In Compare' : 'Add To Compare'}
                                                </button>
                                            </div>
                                            <div className="dz-info mb-0">
                                                <ul>
                                                    <li>
                                                        <strong>SKU:</strong>
                                                        <span>
                                                            {matchedVariant?.product?.sku || sku}
                                                        </span>
                                                    </li>
                                                    {categories.length > 0 && (
                                                        <li>
                                                            <strong>Category:</strong>
                                                            {categories.map((category, index) => (
                                                                <span key={category.uid}>
                                                                    {category.name}
                                                                    {index < categories.length - 1
                                                                        ? ','
                                                                        : ''}
                                                                </span>
                                                            ))}
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" onClick={onClose} />
        </>
    );
};

export default QuickViewModal;
