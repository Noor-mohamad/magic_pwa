import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useAddToCartButton } from '@magento/peregrine/lib/talons/Gallery/useAddToCartButton';
import Price from '@magento/venia-ui/lib/components/Price';

import inlinePriceClasses from './inlinePriceClasses';

const STAR_PATH =
    'M7.24805 0.734375L9.22301 5.01608L13.9054 5.57126L10.4436 8.77267L11.3625 13.3975L7.24805 11.0944L3.13355 13.3975L4.0525 8.77267L0.590651 5.57126L5.27309 5.01608L7.24805 0.734375Z';

const Star = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={STAR_PATH} fill={filled ? '#FF8A00' : '#E4E5E8'} />
    </svg>
);

/**
 * "shop-card" — the theme's default GRID card (shop-standard.html's
 * "tab-list-grid" pane, which is the pane the theme itself ships with
 * `active show` — i.e. Grid, not List, is the theme's real default
 * view). 4-up at xl via the wrapping column classes in categoryContent.js.
 *
 * Same real-data wiring as the List card (CategoryProductCard.js):
 * useAddToCartButton, Price, rating_summary-based stars, wishlist
 * props passed down from categoryContent.js. Same intentional omissions
 * too (see categoryContent.js's doc comment): no Sale/New product-tag
 * ribbon and no dz-tags — both need product fields outside category.js's
 * default query. Quick View has no modal built (deferred), so that
 * button just acts as a second link to the product page rather than
 * being a dead button.
 */
const CategoryProductCardGrid = ({ product, isWishlisted, onToggleWishlist }) => {
    const history = useHistory();
    const { handleAddToCart, isDisabled, isInStock } = useAddToCartButton({
        item: product,
        urlSuffix: ''
    });
    const [justAdded, setJustAdded] = useState(false);

    const { name, small_image, price_range, rating_summary, url_key } = product;
    const finalPrice = price_range.maximum_price.final_price;
    const regularPrice = price_range.maximum_price.regular_price;
    const hasDiscount = price_range.maximum_price.discount?.amount_off > 0;

    const productUrl = `/${url_key}.html`;
    const goToProduct = e => {
        e.preventDefault();
        history.push(productUrl);
    };

    const filledStars = rating_summary ? Math.round((rating_summary / 100) * 5) : 0;

    const onAddToCart = () => {
        handleAddToCart();
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
    };

    return (
        <div className="shop-card">
            <div className="dz-media">
                {/*
                    The theme's own demo photos (images/shop/product/*.png)
                    are ~300x290 (near-square) and unconstrained in CSS.
                    Real catalog photos are portrait (~4:5, full-body
                    shots) — cropping those to a square with objectFit:
                    cover clipped heads/feet. `contain` shows the whole
                    photo, centered, inside a fixed 4:5 box instead, so
                    every card is still the same size but nothing gets
                    cut off.
                */}
                <a href={productUrl} onClick={goToProduct}>
                    <img
                        src={small_image?.url}
                        alt={name}
                        style={{
                            width: '100%',
                            aspectRatio: '4 / 5',
                            objectFit: 'contain',
                            objectPosition: 'center'
                        }}
                    />
                </a>
                <div className="shop-meta">
                    <a
                        href={productUrl}
                        onClick={goToProduct}
                        className="btn btn-secondary btn-icon"
                        title="View product"
                    >
                        <i className="fa-solid fa-eye d-md-none d-block" />
                        <span className="d-md-block d-none">Quick View</span>
                    </a>
                    <button
                        type="button"
                        className={'btn btn-primary meta-icon dz-wishicon' + (isWishlisted ? ' active' : '')}
                        onClick={onToggleWishlist}
                        aria-label="Add to wishlist"
                        aria-pressed={isWishlisted}
                    >
                        <svg className="dz-heart-fill" width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.6412 5.80113C13.0778 6.9649 12.0762 8.02624 11.1657 8.8827C10.5113 9.49731 9.19953 10.7322 7.77683 11.62C7.30164 11.9159 6.69842 11.9159 6.22323 11.62C4.80338 10.7322 3.4888 9.49731 2.83435 8.8827C1.92382 8.02624 0.92224 6.96205 0.358849 5.80113C-0.551681 3.91747 0.344622 1.44196 2.21121 0.557041C3.98674 -0.282354 5.54034 0.292418 7.00003 1.44765C8.45972 0.292418 10.0133 -0.282354 11.786 0.557041C13.6554 1.44196 14.5517 3.91747 13.6412 5.80113Z" fill="white" />
                        </svg>
                        <svg className="dz-heart feather feather-heart" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={'btn btn-primary meta-icon dz-carticon' + (justAdded ? ' active' : '')}
                        onClick={onAddToCart}
                        disabled={isDisabled || !isInStock}
                        aria-label={isInStock ? 'Add to cart' : 'Out of stock'}
                        title={isInStock ? 'Add to cart' : 'Out of stock'}
                    >
                        <svg className="dz-cart-check" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.9144 3.73438L5.49772 10.151L2.58105 7.23438" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <svg className="dz-cart-out" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.6033 10.4092C9.70413 10.4083 8.97452 11.1365 8.97363 12.0357C8.97274 12.9348 9.70097 13.6644 10.6001 13.6653C11.4993 13.6662 12.2289 12.938 12.2298 12.0388C12.2298 12.0383 12.2298 12.0378 12.2298 12.0373C12.2289 11.1391 11.5014 10.4109 10.6033 10.4092Z" fill="white" />
                            <path d="M13.4912 2.6132C13.4523 2.60565 13.4127 2.60182 13.373 2.60176H3.46022L3.30322 1.55144C3.20541 0.853911 2.60876 0.334931 1.90439 0.334717H0.627988C0.281154 0.334717 0 0.61587 0 0.962705C0 1.30954 0.281154 1.59069 0.627988 1.59069H1.90595C1.9858 1.59011 2.05338 1.64957 2.06295 1.72886L3.03004 8.35727C3.16263 9.19953 3.88712 9.8209 4.73975 9.82363H11.2724C12.0933 9.8247 12.8015 9.24777 12.9664 8.44362L13.9884 3.34906C14.0543 3.00854 13.8317 2.67909 13.4912 2.6132Z" fill="white" />
                            <path d="M6.61539 11.9676C6.57716 11.0948 5.85687 10.4077 4.98324 10.4108C4.08483 10.4471 3.38595 11.2048 3.42225 12.1032C3.45708 12.9653 4.15833 13.6505 5.02092 13.6653H5.06017C5.95846 13.626 6.65474 12.8658 6.61539 11.9676Z" fill="white" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="dz-content">
                <h5 className="title">
                    <a href={productUrl} onClick={goToProduct}>
                        {name}
                    </a>
                </h5>
                <ul className="star-rating">
                    {[0, 1, 2, 3, 4].map(i => (
                        <li key={i}>
                            <Star filled={i < filledStars} />
                        </li>
                    ))}
                </ul>
                <h6 className="price">
                    {hasDiscount && (
                        <del>
                            <Price
                                value={regularPrice.value}
                                currencyCode={regularPrice.currency}
                                classes={inlinePriceClasses}
                            />
                        </del>
                    )}
                    <Price
                        value={finalPrice.value}
                        currencyCode={finalPrice.currency}
                        classes={inlinePriceClasses}
                    />
                </h6>
            </div>
        </div>
    );
};

export default CategoryProductCardGrid;
