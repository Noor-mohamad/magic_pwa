import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { gql, useMutation, useQuery } from '@apollo/client';

import { useProductFullDetail } from '@magento/peregrine/lib/talons/ProductFullDetail/useProductFullDetail';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useAwaitQuery } from '@magento/peregrine/lib/hooks/useAwaitQuery';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import BrowserPersistence from '@magento/peregrine/lib/util/simplePersistence';
import Price from '@magento/venia-ui/lib/components/Price';
import Breadcrumbs from '@magento/venia-ui/lib/components/Breadcrumbs';

import inlinePriceClasses from '../inlinePriceClasses';
import { normalizeCmsHtml } from '../normalizeCmsHtml';
import { useCompareList } from '../compareList/useCompareList';
import CategoryProductCardGrid from '../CategoryProductCardGrid';
import QuickViewModal from '../QuickViewModal';
import ProductReviews from './ProductReviews';
import boxIcon from '../images/svg/box.svg';

const STAR_PATH =
    'M6.74805 0.234375L8.72301 4.51608L13.4054 5.07126L9.9436 8.27267L10.8625 12.8975L6.74805 10.5944L2.63355 12.8975L3.5525 8.27267L0.090651 5.07126L4.77309 4.51608L6.74805 0.234375Z';

const Star = ({ filled }) => (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={STAR_PATH} fill={filled ? '#FF8A00' : '#5E626F'} opacity={filled ? 1 : 0.2} />
    </svg>
);

const ADD_PRODUCT_TO_CART = gql`
    mutation moonCartPdpAddProductToCart($cartId: String!, $product: CartItemInput!) {
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
    mutation moonCartPdpCreateCart {
        cartId: createEmptyCart
    }
`;

const CART_DETAILS_QUERY = gql`
    query moonCartPdpCheckUserIsAuthed($cartId: String!) {
        cart(cart_id: $cartId) {
            id
        }
    }
`;

const GET_WISHLIST = gql`
    query getMoonCartPdpWishlist {
        customer {
            wishlists {
                id
                items_v2(pageSize: 100) {
                    items {
                        id
                        product {
                            uid
                        }
                    }
                }
            }
        }
    }
`;

const ADD_TO_WISHLIST = gql`
    mutation addMoonCartPdpWishlistItem($wishlistId: ID!, $sku: String!) {
        addProductsToWishlist(wishlistId: $wishlistId, products: [{ sku: $sku, quantity: 1 }]) {
            wishlist {
                id
            }
        }
    }
`;

const REMOVE_FROM_WISHLIST = gql`
    mutation removeMoonCartPdpWishlistItem($wishlistId: ID!, $itemIds: [ID!]!) {
        removeProductsFromWishlist(wishlistId: $wishlistId, wishlistItemsIds: $itemIds) {
            wishlist {
                id
            }
        }
    }
`;

/**
 * Theme port of product-thumbnail.html — the real product detail
 * page, replacing stock venia-ui's <ProductFullDetail> (see
 * RootComponents/Product/product.js for why that had to happen at
 * all — a real GraphQL schema bug, not a design choice). Receives the
 * fully-loaded product straight from that file's own query (already
 * includes configurable_options/variants/related_products/reviews —
 * unlike QuickViewModal, there's no separate "supplementary" fetch or
 * loading-gate needed here, since it's all one query up front).
 *
 * Configurable options + Add to Cart reuse the exact same pattern as
 * QuickViewModal.js: Peregrine's real useProductFullDetail talon for
 * variant matching / stock validation, a locally-tracked selection map
 * for the active swatch/pill + price/image lookups, and a hand-written
 * add-to-cart mutation (bypassing the talon's own, which both 500s on
 * this schema and swallows its own errors — see QuickViewModal.js's
 * doc comment for the full trace).
 *
 * Simplifications vs. the theme's own markup:
 *  - Gallery is click-to-swap thumbnails, not the Swiper/lightGallery
 *    carousel+zoom (same reasoning as every other gallery in this
 *    project — Swiper isn't ported).
 *  - The Description tab shows the product's own real description —
 *    the theme's own demo content there ("Fits Your Child",
 *    Specifications, Fabric Content, Chemical Statement, the 4-image
 *    product-media grid) is specific to its one demo baby-car-seat
 *    product with no generic Magento field behind any of it, so none
 *    of that is faked in for arbitrary real products.
 *  - Reviews tab is real (list + a real star-rating write-a-review
 *    form) — see ProductReviews.js.
 *  - Related Products is real (ProductInterface.related_products) —
 *    renders only when Admin has actually configured relations for
 *    this SKU; no fallback/fake items when empty.
 *  - The "FREE Shipping / 30 Days Easy Returns" trust row is the
 *    theme's own static copy (by your own choice) — it isn't
 *    product-specific, so there's no real per-product field it could
 *    come from anyway.
 *  - "Tags" and the Instagram share icon are dropped — no Magento
 *    equivalent for tags (same decision as the category sidebar), and
 *    Instagram has no web share-intent URL to link to (unlike
 *    Facebook/LinkedIn/Twitter, which use their real one below).
 */
const ProductDetail = ({ product }) => {
    const history = useHistory();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedByAttributeCode, setSelectedByAttributeCode] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [addStatus, setAddStatus] = useState(null);
    const [addErrorMessage, setAddErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    const isConfigurable = product.__typename === 'ConfigurableProduct';
    const configurableOptions = useMemo(
        () =>
            [...(product.configurable_options || [])].sort(
                (a, b) => (a.position || 0) - (b.position || 0)
            ),
        [product]
    );
    const variants = product.variants || [];

    const { handleSelectionChange, isAddToCartDisabled } = useProductFullDetail({
        product
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

    // --- Cart --------------------------------------------------------
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

    // --- Wishlist ------------------------------------------------------
    const [{ isSignedIn }] = useUserContext();
    const { data: wishlistData, refetch: refetchWishlist } = useQuery(GET_WISHLIST, {
        skip: !isSignedIn,
        fetchPolicy: 'cache-and-network'
    });
    const wishlist = wishlistData?.customer?.wishlists?.[0];
    const wishlistedProductUids = new Set(
        (wishlist?.items_v2?.items || []).map(item => item.product.uid)
    );
    const wishlistItemIdByProductUid = new Map(
        (wishlist?.items_v2?.items || []).map(item => [item.product.uid, item.id])
    );
    const [addToWishlist] = useMutation(ADD_TO_WISHLIST);
    const [removeFromWishlist] = useMutation(REMOVE_FROM_WISHLIST);

    const handleToggleWishlist = async targetProduct => {
        if (!isSignedIn) {
            history.push('/sign-in');
            return;
        }
        if (!wishlist) return;
        try {
            if (wishlistedProductUids.has(targetProduct.uid)) {
                await removeFromWishlist({
                    variables: {
                        wishlistId: wishlist.id,
                        itemIds: [wishlistItemIdByProductUid.get(targetProduct.uid)]
                    }
                });
            } else {
                await addToWishlist({
                    variables: { wishlistId: wishlist.id, sku: targetProduct.sku }
                });
            }
            refetchWishlist();
        } catch (e) {
            // Error surfaced via Apollo's error link toast.
        }
    };

    // --- Compare ---------------------------------------------------------
    const { isInCompare, toggleCompare } = useCompareList();

    // --- Breadcrumb ------------------------------------------------------
    const breadcrumbCategoryId = product.categories?.[0]?.uid;

    // --- Gallery / price / images for the current selection --------------
    const variantImages = matchedVariant?.product?.media_gallery?.map(m => m.url) || [];
    const images = variantImages.length
        ? variantImages
        : product.media_gallery?.length
        ? product.media_gallery.map(m => m.url)
        : product.small_image?.url
        ? [product.small_image.url]
        : [];

    const displayPriceRange = matchedVariant
        ? matchedVariant.product.price_range
        : product.price_range;
    const finalPrice = displayPriceRange.maximum_price.final_price;
    const regularPrice = displayPriceRange.maximum_price.regular_price;
    const discount = displayPriceRange.maximum_price.discount;
    const hasDiscount = discount?.amount_off > 0;

    const filledStars = product.rating_summary
        ? Math.round((product.rating_summary / 100) * 5)
        : 0;

    const descriptionHtml = product.description?.html || product.short_description?.html;
    const shortDescriptionHtml = product.short_description?.html;

    const relatedProducts = product.related_products || [];

    const handleOptionSelect = (option, value) => {
        handleSelectionChange(option.attribute_id, value.value_index);
        setSelectedByAttributeCode(prev => ({
            ...prev,
            [option.attribute_code]: value.value_index
        }));
        setActiveImageIndex(0);
        setAddStatus(null);
    };

    const handleAddToCartClick = async () => {
        setIsAdding(true);
        setAddStatus(null);
        try {
            const newCartId = await ensureCartId();

            const productInput = { sku: product.sku, quantity };
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

    const shareUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/${product.url_key}.html`
            : '';

    return (
        <div className="moon-cart-product-page">
            <div className="d-sm-flex justify-content-between container-fluid py-3">
                <nav aria-label="breadcrumb" className="breadcrumb-row">
                    <Breadcrumbs categoryId={breadcrumbCategoryId} currentProduct={product.name} />
                </nav>
            </div>

            <section className="content-inner py-0">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-xl-6 col-md-6">
                            <div className="dz-product-detail sticky-top">
                                <div className="dz-media" style={{ height: 'auto' }}>
                                    <img
                                        src={images[activeImageIndex] || product.small_image?.url}
                                        alt={product.name}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1 / 1',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>
                                {images.length > 1 && (
                                    <div className="d-flex flex-wrap mt-3" style={{ gap: 8 }}>
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
                                                    width: 76,
                                                    height: 76,
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
                            <div className="dz-product-detail style-2 p-t50">
                                <div className="dz-content">
                                    <div className="dz-content-footer">
                                        <div className="dz-content-start">
                                            {hasDiscount && (
                                                <span className="badge bg-purple mb-2">
                                                    SALE {Math.round(discount.amount_off)}% Off
                                                </span>
                                            )}
                                            <h4 className="title mb-1">{product.name}</h4>
                                            <div className="review-num">
                                                {product.rating_summary ? (
                                                    <>
                                                        <ul className="dz-rating me-2">
                                                            {[0, 1, 2, 3, 4].map(i => (
                                                                <li key={i}>
                                                                    <Star filled={i < filledStars} />
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <span className="text-secondary me-2">
                                                            {(product.rating_summary / 20).toFixed(1)}{' '}
                                                            Rating
                                                        </span>
                                                        <a
                                                            href="#reviews"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                setActiveTab('reviews');
                                                            }}
                                                        >
                                                            ({product.review_count} customer review
                                                            {product.review_count === 1 ? '' : 's'})
                                                        </a>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">No reviews yet</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {shortDescriptionHtml && (
                                        <div
                                            className="para-text"
                                            dangerouslySetInnerHTML={{
                                                __html: normalizeCmsHtml(shortDescriptionHtml)
                                            }}
                                        />
                                    )}

                                    {configurableOptions.map(option => (
                                        <div className="widget mb-3" key={option.uid}>
                                            <label className="form-label d-block">{option.label}</label>
                                            {option.attribute_code === 'color' ? (
                                                <div className="d-flex align-items-center flex-wrap color-filter">
                                                    {option.values.map(value => {
                                                        const hex = value.swatch_data?.value;
                                                        const active =
                                                            selectedByAttributeCode[option.attribute_code] ===
                                                            value.value_index;
                                                        return (
                                                            <div
                                                                className="form-check"
                                                                key={value.uid}
                                                                title={value.label}
                                                            >
                                                                <input
                                                                    className="form-check-input"
                                                                    type="radio"
                                                                    name={`pdp-${option.uid}`}
                                                                    checked={active}
                                                                    onChange={() =>
                                                                        handleOptionSelect(option, value)
                                                                    }
                                                                    aria-label={value.label}
                                                                />
                                                                <span
                                                                    style={{
                                                                        backgroundColor: hex || '#D7D7D7',
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
                                                <div className="btn-group product-size mb-0">
                                                    {option.values.map(value => {
                                                        const active =
                                                            selectedByAttributeCode[option.attribute_code] ===
                                                            value.value_index;
                                                        return (
                                                            <button
                                                                key={value.uid}
                                                                type="button"
                                                                className={
                                                                    'btn ' +
                                                                    (active ? 'btn-secondary' : 'btn-light')
                                                                }
                                                                onClick={() => handleOptionSelect(option, value)}
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
                                            <span className="price-name">Price</span>
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
                                            <div className="d-flex align-items-center" style={{ gap: 4 }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={quantity}
                                                    onChange={e =>
                                                        setQuantity(
                                                            Math.max(1, parseInt(e.target.value, 10) || 1)
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
                                                    history.push('/cart');
                                                }}
                                            >
                                                View Cart
                                            </a>
                                        </div>
                                    )}
                                    {addStatus === 'error' && (
                                        <div className="alert alert-danger">{addErrorMessage}</div>
                                    )}

                                    <div className="btn-group cart-btn">
                                        <button
                                            type="button"
                                            className="btn btn-secondary text-uppercase"
                                            onClick={handleAddToCartClick}
                                            disabled={isAdding || isAddToCartDisabled}
                                        >
                                            {addToCartLabel}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-light btn-icon"
                                            onClick={() => handleToggleWishlist(product)}
                                        >
                                            <i
                                                className="icon feather icon-heart"
                                                style={{ marginRight: 6 }}
                                            />
                                            {wishlistedProductUids.has(product.uid)
                                                ? 'In Wishlist'
                                                : 'Add To Wishlist'}
                                        </button>
                                    </div>
                                    <div className="dz-info">
                                        <ul>
                                            <li>
                                                <strong>SKU:</strong>
                                                <span>{matchedVariant?.product?.sku || product.sku}</span>
                                            </li>
                                            {product.categories?.length > 0 && (
                                                <li>
                                                    <strong>Category:</strong>
                                                    {product.categories.map((category, index) => (
                                                        <span key={category.uid}>
                                                            {category.name}
                                                            {index < product.categories.length - 1
                                                                ? ','
                                                                : ''}
                                                        </span>
                                                    ))}
                                                </li>
                                            )}
                                            {shareUrl && (
                                                <li>
                                                    <strong>Share:</strong>
                                                    <span>
                                                        <a
                                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                                                shareUrl
                                                            )}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <i className="fa-brands fa-facebook-f" />
                                                        </a>
                                                    </span>
                                                    <span>
                                                        <a
                                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                                                shareUrl
                                                            )}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <i className="fa-brands fa-linkedin-in" />
                                                        </a>
                                                    </span>
                                                    <span>
                                                        <a
                                                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                                                shareUrl
                                                            )}&text=${encodeURIComponent(product.name)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <i className="fa-brands fa-twitter" />
                                                        </a>
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    <ul className="d-md-flex d-none align-items-center">
                                        <li className="icon-bx-wraper style-3 me-xl-4 me-2">
                                            <div className="icon-bx">
                                                <i className="flaticon flaticon-ship" />
                                            </div>
                                            <div className="info-content">
                                                <span>FREE</span>
                                                <h6 className="dz-title mb-0">Shipping</h6>
                                            </div>
                                        </li>
                                        <li className="icon-bx-wraper style-3">
                                            <div className="icon-bx">
                                                <img src={boxIcon} alt="/" />
                                            </div>
                                            <div className="info-content">
                                                <span>Easy Returns</span>
                                                <h6 className="dz-title mb-0">30 Days</h6>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content-inner-3 pb-0">
                <div className="container">
                    <div className="product-description">
                        <div className="dz-tabs">
                            <ul className="nav nav-tabs center" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        type="button"
                                        className={
                                            'nav-link' + (activeTab === 'description' ? ' active' : '')
                                        }
                                        onClick={() => setActiveTab('description')}
                                    >
                                        Description
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        type="button"
                                        id="reviews"
                                        className={
                                            'nav-link' + (activeTab === 'reviews' ? ' active' : '')
                                        }
                                        onClick={() => setActiveTab('reviews')}
                                    >
                                        Reviews ({product.review_count})
                                    </button>
                                </li>
                            </ul>
                            <div className="tab-content">
                                {activeTab === 'description' && (
                                    <div className="tab-pane fade show active">
                                        {descriptionHtml ? (
                                            <div
                                                className="section-head style-2 d-block"
                                                dangerouslySetInnerHTML={{
                                                    __html: normalizeCmsHtml(descriptionHtml)
                                                }}
                                            />
                                        ) : (
                                            <p className="text-muted">
                                                No description available for this product.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'reviews' && (
                                    <div className="tab-pane fade show active">
                                        <ProductReviews
                                            sku={product.sku}
                                            reviewCount={product.review_count}
                                            reviews={product.reviews?.items || []}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {relatedProducts.length > 0 && (
                <section className="content-inner-1 overlay-white-middle overflow-hidden">
                    <div className="container">
                        <div className="section-head style-2">
                            <div className="left-content">
                                <h2 className="title mb-0">Related products</h2>
                            </div>
                        </div>
                        <div className="row gx-xl-4 g-3">
                            {relatedProducts.map(related => (
                                <div
                                    className="col-6 col-xl-3 col-lg-4 col-md-4 col-sm-6 m-md-b15 m-b30"
                                    key={related.uid}
                                >
                                    <CategoryProductCardGrid
                                        product={related}
                                        isWishlisted={wishlistedProductUids.has(related.uid)}
                                        onToggleWishlist={() => handleToggleWishlist(related)}
                                        isInCompare={isInCompare(related.uid)}
                                        onToggleCompare={toggleCompare}
                                        onQuickView={setQuickViewProduct}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <QuickViewModal
                product={quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                isWishlisted={
                    quickViewProduct ? wishlistedProductUids.has(quickViewProduct.uid) : false
                }
                onToggleWishlist={() =>
                    quickViewProduct && handleToggleWishlist(quickViewProduct)
                }
                isInCompare={quickViewProduct ? isInCompare(quickViewProduct.uid) : false}
                onToggleCompare={() =>
                    quickViewProduct && toggleCompare(quickViewProduct)
                }
            />
        </div>
    );
};

export default ProductDetail;
