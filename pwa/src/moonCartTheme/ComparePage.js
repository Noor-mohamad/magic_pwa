import React from 'react';
import { useHistory } from 'react-router-dom';

import { useAddToCartButton } from '@magento/peregrine/lib/talons/Gallery/useAddToCartButton';
import Price from '@magento/venia-ui/lib/components/Price';

import inlinePriceClasses from './inlinePriceClasses';
import { useCompareList } from './compareList/useCompareList';

// Same real add-to-cart behavior as the grid cards (useAddToCartButton) —
// a small subcomponent because hooks can't be called from inside a
// .map() callback in the table body below.
const CompareAddToCartCell = ({ product }) => {
    const { handleAddToCart, isDisabled, isInStock } = useAddToCartButton({
        item: product,
        urlSuffix: ''
    });
    const isConfigurable = product.__typename === 'ConfigurableProduct';

    return (
        <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleAddToCart}
            disabled={isDisabled && !isConfigurable}
        >
            {isConfigurable ? 'Select Options' : isInStock ? 'Add To Cart' : 'Out of Stock'}
        </button>
    );
};

/**
 * Standalone "/compare" page (see Routes.js). The theme ships real
 * CSS for a compare table (scss/pages/_compare.scss — ".compare-table",
 * ".compare-table-head", ".shop-card.style-1", ...) but no actual
 * demo HTML for it (no compare.html in the package, and no icon
 * anywhere in the shipped pages that links to one) — so this JSX
 * structure is built directly from that SCSS rather than ported from
 * an existing markup file.
 *
 * Data comes from the same real Magento Compare List as the grid
 * cards' Compare icon (see compareList/useCompareList.js) — adding or
 * removing a product on the category page and then visiting this
 * page shows the same real, persisted list.
 */
const ComparePage = () => {
    const history = useHistory();
    const { items, removeFromCompare } = useCompareList();

    const goToProduct = (e, urlKey) => {
        e.preventDefault();
        history.push(`/${urlKey}.html`);
    };

    if (items.length === 0) {
        return (
            <div className="container" style={{ padding: '140px 20px 80px', textAlign: 'center' }}>
                <h2>Your compare list is empty</h2>
                <p className="text-muted">
                    Use the compare icon on a product card to add items here.
                </p>
                <a href="/" className="btn btn-secondary" onClick={e => {
                    e.preventDefault();
                    history.push('/');
                }}>
                    Continue Shopping
                </a>
            </div>
        );
    }

    const products = items.map(item => item.product);

    const rows = [
        {
            label: 'Price',
            render: product => {
                const finalPrice = product.price_range.maximum_price.final_price;
                const regularPrice = product.price_range.maximum_price.regular_price;
                const hasDiscount = product.price_range.maximum_price.discount?.amount_off > 0;
                return (
                    <>
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
                    </>
                );
            }
        },
        {
            label: 'Rating',
            render: product =>
                product.rating_summary
                    ? `${(product.rating_summary / 20).toFixed(1)} / 5`
                    : 'No reviews yet'
        },
        {
            label: 'Availability',
            render: product => (product.stock_status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock')
        },
        {
            label: 'SKU',
            render: product => product.sku
        }
    ];

    // The theme's header is always position:absolute
    // (".header-transparent", see header.js) — every real page clears
    // it with a tall banner section above its actual content (e.g.
    // category pages' ".dz-bnr-inr"). This page has no banner, so it
    // needs that same clearance itself; 140px matches real top-padding
    // values already used elsewhere in the theme's own compiled CSS
    // for this exact purpose, comfortably past the header's own ~80px
    // height.
    return (
        <div className="container" style={{ paddingTop: 140, paddingBottom: 60 }}>
            <h2 className="mb-4">Compare Products</h2>
            <div className="table-responsive">
                {/*
                    scss/pages/_compare.scss's ".compare-table" carries
                    a -400px top margin — meant to pull the table up
                    to overlap a hero banner image the theme's own
                    compare page would have above it. This standalone
                    page has no such banner, so that offset is
                    neutralized here (inline style beats the class's
                    rule at every breakpoint, since none of them use
                    !important).
                */}
                <table className="compare-table" style={{ marginTop: 0 }}>
                    <tbody>
                        <tr className="compare-table-head compare-product">
                            <td />
                            {products.map(product => (
                                <td key={product.uid}>
                                    <div className="shop-card style-1" style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCompare(product)}
                                            aria-label="Remove from compare"
                                            title="Remove from compare"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                border: 0,
                                                background: 'none',
                                                fontSize: 18,
                                                lineHeight: 1,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ×
                                        </button>
                                        <div className="dz-media">
                                            <a
                                                href={`/${product.url_key}.html`}
                                                onClick={e => goToProduct(e, product.url_key)}
                                            >
                                                <img
                                                    src={product.small_image?.url}
                                                    alt={product.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            </a>
                                        </div>
                                        <div className="dz-content">
                                            <h6 className="title">
                                                <a
                                                    href={`/${product.url_key}.html`}
                                                    onClick={e => goToProduct(e, product.url_key)}
                                                >
                                                    {product.name}
                                                </a>
                                            </h6>
                                        </div>
                                    </div>
                                </td>
                            ))}
                        </tr>
                        {rows.map(row => (
                            <tr key={row.label}>
                                <td>
                                    <strong>{row.label}</strong>
                                </td>
                                {products.map(product => (
                                    <td key={product.uid}>{row.render(product)}</td>
                                ))}
                            </tr>
                        ))}
                        <tr className="compare-end">
                            <td />
                            {products.map(product => (
                                <td key={product.uid}>
                                    <CompareAddToCartCell product={product} />
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComparePage;
