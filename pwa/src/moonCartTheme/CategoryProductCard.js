import React from 'react';
import { useHistory } from 'react-router-dom';

import { useAddToCartButton } from '@magento/peregrine/lib/talons/Gallery/useAddToCartButton';
import Price from '@magento/venia-ui/lib/components/Price';

import inlinePriceClasses from './inlinePriceClasses';

const STAR_PATH =
    'M6.74805 0.234375L8.72301 4.51608L13.4054 5.07126L9.9436 8.27267L10.8625 12.8975L6.74805 10.5944L2.63355 12.8975L3.5525 8.27267L0.090651 5.07126L4.77309 4.51608L6.74805 0.234375Z';

const Star = ({ filled }) => (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d={STAR_PATH}
            fill={filled ? '#24262B' : '#5E626F'}
            opacity={filled ? 1 : 0.2}
        />
    </svg>
);

/**
 * "dz-shop-card style-2" — the theme's product listing card
 * (shop-standard.html, "List" tab). Real Magento product data in;
 * add-to-cart and wishlist reuse the same mutations/talons already
 * wired elsewhere in the app (useAddToCartButton, wishlist mutations
 * passed down from categoryContent.js).
 *
 * Not included (see categoryContent.js's doc comment for the full
 * list/why): dz-tags (product categories — needs a wider query),
 * Sale/New ribbon (same), Quick View.
 */
const CategoryProductCard = ({ product, isWishlisted, onToggleWishlist }) => {
    const history = useHistory();
    const { handleAddToCart, isDisabled, isInStock } = useAddToCartButton({
        item: product,
        urlSuffix: ''
    });

    const { name, small_image, price_range, rating_summary, url_key } = product;
    const finalPrice = price_range.maximum_price.final_price;
    const regularPrice = price_range.maximum_price.regular_price;
    const hasDiscount = price_range.maximum_price.discount?.amount_off > 0;

    const productUrl = `/${url_key}.html`;
    const goToProduct = e => {
        e.preventDefault();
        history.push(productUrl);
    };

    const filledStars = rating_summary
        ? Math.round((rating_summary / 100) * 5)
        : 0;

    return (
        <div className="dz-shop-card style-2">
            {/*
                The theme's own .dz-shop-card.style-2 CSS never constrains
                .dz-media's width — it relies entirely on the theme's demo
                photos already being small and uniform. Real catalog photos
                (much larger, varying aspect ratios) were blowing out the
                flex row and squeezing .dz-content down to almost nothing,
                hence the inline size/crop here.
            */}
            <div className="dz-media" style={{ flex: '0 0 220px', width: 220 }}>
                <a href={productUrl} onClick={goToProduct}>
                    <img
                        src={small_image?.url}
                        alt={name}
                        style={{ width: 220, height: 220, objectFit: 'cover' }}
                    />
                </a>
            </div>
            <div className="dz-content">
                <div className="dz-header">
                    <div>
                        <h4 className="title mb-0">
                            <a href={productUrl} onClick={goToProduct}>
                                {name}
                            </a>
                        </h4>
                    </div>
                    <div className="review-num">
                        {rating_summary ? (
                            <>
                                <ul className="dz-rating">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <li key={i}>
                                            <Star filled={i < filledStars} />
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <span className="text-muted">No reviews yet</span>
                        )}
                    </div>
                </div>
                <div className="dz-body">
                    <div className="rate">
                        <div className="d-flex align-items-center mb-xl-3 mb-2">
                            <div className="meta-content">
                                <span className="price-name">Price</span>
                                <span className="price-num">
                                    <Price
                                        value={finalPrice.value}
                                        currencyCode={finalPrice.currency}
                                        classes={inlinePriceClasses}
                                    />
                                    {hasDiscount && (
                                        <del className="ms-2 text-muted">
                                            <Price
                                                value={regularPrice.value}
                                                currencyCode={regularPrice.currency}
                                                classes={inlinePriceClasses}
                                            />
                                        </del>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="d-flex">
                            <button
                                type="button"
                                className="btn btn-secondary btn-md btn-icon"
                                disabled={isDisabled || !isInStock}
                                onClick={handleAddToCart}
                            >
                                <span className="d-md-block d-none">
                                    {isInStock ? 'Add to cart' : 'Out of stock'}
                                </span>
                            </button>
                            <div className="bookmark-btn style-1">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={isWishlisted}
                                    onChange={onToggleWishlist}
                                    aria-label="Add to wishlist"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryProductCard;
