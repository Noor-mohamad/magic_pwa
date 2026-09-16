import React, { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation } from 'react-router-dom';

import { useCategoryContent } from '@magento/peregrine/lib/talons/RootComponents/Category';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import {
    getSearchFromState,
    getFiltersFromSearch
} from '@magento/peregrine/lib/talons/FilterModal/helpers';
import resourceUrl from '@magento/peregrine/lib/util/makeUrl';
import Breadcrumbs from '@magento/venia-ui/lib/components/Breadcrumbs';

import { normalizeCmsHtml } from '../../../../../../src/moonCartTheme/normalizeCmsHtml';
import CategoryProductCard from '../../../../../../src/moonCartTheme/CategoryProductCard';
import CategoryProductCardGrid from '../../../../../../src/moonCartTheme/CategoryProductCardGrid';
import CategoryProductCollage from '../../../../../../src/moonCartTheme/CategoryProductCollage';
import PriceRangeSlider from '../../../../../../src/moonCartTheme/PriceRangeSlider';
import colorSwatchHex from '../../../../../../src/moonCartTheme/colorSwatchHex';
import ThemeSelect from '../../../../../../src/moonCartTheme/ThemeSelect';
import ShopViewSwitcher from '../../../../../../src/moonCartTheme/ShopViewSwitcher';
import { decodeHtmlEntities } from '../../../../../../src/moonCartTheme/decodeHtmlEntities';
import QuickViewModal from '../../../../../../src/moonCartTheme/QuickViewModal';
import { useCompareList } from '../../../../../../src/moonCartTheme/compareList/useCompareList';

// Attribute codes with their own dedicated widget below (slider,
// swatches, pills). Every other real aggregation the catalog returns
// (material, activity, climate, pattern, sale, new, ...) still gets a
// widget too — see the generic "other filters" loop — just with a
// plain checkbox-pill UI, since the theme's own static demo never
// designed a bespoke look for those attributes.
const DEDICATED_FILTER_CODES = ['price', 'color', 'size'];

// Row/column classes + card component per ShopViewSwitcher view — taken
// straight from each view's own tab-pane in shop-standard.html
// ("collage" isn't a simple grid, so CategoryProductCollage handles
// that one separately).
const VIEW_CONFIG = {
    list: {
        rowClass: 'row',
        colClass: 'col-md-12 col-sm-12 col-xxxl-6',
        placeholderClass: 'dz-shop-card style-2',
        Card: CategoryProductCard
    },
    column: {
        rowClass: 'row gx-xl-4 g-3 mb-xl-0 mb-md-0 mb-3',
        colClass: 'col-6 col-xl-4 col-lg-6 col-md-6 col-sm-6 m-md-b15 m-sm-b0 m-b30',
        placeholderClass: 'shop-card',
        Card: CategoryProductCardGrid
    },
    grid: {
        rowClass: 'row gx-xl-4 g-3',
        colClass: 'col-6 col-xl-3 col-lg-4 col-md-4 col-sm-6 m-md-b15 m-b30',
        placeholderClass: 'shop-card',
        Card: CategoryProductCardGrid
    }
};

const GET_SUBCATEGORIES = gql`
    query getMoonCartSubcategories($id: String!) {
        categories(filters: { category_uid: { in: [$id] } }) {
            items {
                uid
                children {
                    uid
                    name
                    product_count
                    url_path
                }
            }
        }
    }
`;

const GET_WISHLIST_FOR_CATEGORY = gql`
    query getMoonCartWishlistForCategory {
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
    mutation addMoonCartCategoryWishlistItem($wishlistId: ID!, $sku: String!) {
        addProductsToWishlist(
            wishlistId: $wishlistId
            products: [{ sku: $sku, quantity: 1 }]
        ) {
            wishlist {
                id
            }
        }
    }
`;

const REMOVE_FROM_WISHLIST = gql`
    mutation removeMoonCartCategoryWishlistItem(
        $wishlistId: ID!
        $itemIds: [ID!]!
    ) {
        removeProductsFromWishlist(
            wishlistId: $wishlistId
            wishlistItemsIds: $itemIds
        ) {
            wishlist {
                id
            }
        }
    }
`;

const GET_ICON_BOX_BLOCK = gql`
    query getMoonCartShopIconBox {
        cmsBlocks(identifiers: ["shop_icon_box"]) {
            items {
                content
            }
        }
    }
`;

/**
 * MoonCart category (product listing) page — theme port of
 * theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/shop-standard.html.
 *
 * category.js (the actual RootComponent Magento routes to for category
 * URLs) is untouched — it still owns URL/pagination/sort/meta
 * orchestration via Peregrine's own useCategory talon. Only its sibling
 * "./categoryContent" import is redirected here (see webpack.config.js),
 * so this component receives the exact same props stock Venia's
 * CategoryContent does: categoryId, data, isLoading, pageControl,
 * sortProps, pageSize.
 *
 * Real data wired: products, price/color/size/category filters (real
 * layered navigation — see the AskUserQuestion checkpoint that scoped
 * this build), sort, pagination, wishlist, add-to-cart, subcategory
 * counts. The theme's own sort dropdown options ("1 Day"/"1 Week"/etc)
 * were decorative demo content unrelated to real product sorting — swapped
 * for the catalog's actual sort options (Position/Name/Price/...).
 *
 * All 4 of the theme's switchable layouts are implemented (List/
 * Column/Grid/Collage — see ShopViewSwitcher.js), defaulting to Grid,
 * the theme's own default (shop-standard.html ships "tab-list-grid" as
 * the `active show` pane, not "tab-list-list"). List reuses
 * CategoryProductCard.js (dz-shop-card style-2); Column and Grid both
 * reuse CategoryProductCardGrid.js, just in different-width columns;
 * Collage groups items into its own big-tile/small-tiles pattern (see
 * CategoryProductCollage.js).
 *
 * Scoped down for v1, per that same checkpoint:
 *  - Color renders as real swatch circles (theme's own ".form-check +
 *    span" pattern) using real hex values — see colorSwatchHex.js for
 *    why that's a DB snapshot rather than a live GraphQL field. Size
 *    still renders as text pills — it's not a swatch attribute in this
 *    catalog (no hex/image to show).
 *  - Price filter is the theme's real dual-handle nouislider (see
 *    PriceRangeSlider.js), bounded by the real min/max from the price
 *    aggregation's buckets.
 *  - Every other real aggregation the catalog exposes for a given
 *    category (material, activity, climate, pattern, sale, new, ...)
 *    gets its own widget too, via the generic "otherFilters" loop —
 *    the theme's static demo never designed a bespoke look for those,
 *    so they render as the same checkbox-pill style as Size.
 *  - Quick View (QuickViewModal.js) and Compare (compareList/
 *    useCompareList.js, a real Magento compare list — see that file's
 *    doc comment) are both wired now; only the sidebar Tags cloud is
 *    still dropped (no Magento equivalent).
 *  - Sale/New ribbon badges, the product card's dz-tags (category links),
 *    and its descriptive paragraph (short_description) all need fields
 *    beyond what category.js's default product query fetches — since
 *    that file is intentionally untouched (see above), none of the
 *    three are wired this pass rather than faked with placeholder text.
 *    Extending that query is a small, contained follow-up if wanted.
 */
const CategoryContent = props => {
    const { categoryId, data, isLoading, pageControl, sortProps, pageSize } = props;
    const [currentSort, setCurrentSort] = sortProps;
    const [viewMode, setViewMode] = useState('grid');
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const { isInCompare, toggleCompare, itemCount: compareCount } = useCompareList();

    const {
        availableSortMethods,
        categoryName,
        categoryDescription,
        filters,
        items,
        totalCount,
        totalPagesFromData
    } = useCategoryContent({ categoryId, data, pageSize });

    const history = useHistory();
    const location = useLocation();
    const activeUrlFilters = useMemo(
        () => getFiltersFromSearch(location.search),
        [location.search]
    );


    const { data: subcategoryData } = useQuery(GET_SUBCATEGORIES, {
        variables: { id: categoryId },
        skip: !categoryId,
        fetchPolicy: 'cache-and-network'
    });
    const subcategories =
        subcategoryData?.categories?.items?.[0]?.children || [];

    const { data: iconBoxData } = useQuery(GET_ICON_BOX_BLOCK, {
        fetchPolicy: 'cache-and-network'
    });
    const iconBoxHtml = normalizeCmsHtml(
        iconBoxData?.cmsBlocks?.items?.[0]?.content
    );

    // --- Wishlist (heart icon on each card) ---------------------------
    const [{ isSignedIn }] = useUserContext();
    const { data: wishlistData, refetch: refetchWishlist } = useQuery(
        GET_WISHLIST_FOR_CATEGORY,
        { skip: !isSignedIn, fetchPolicy: 'cache-and-network' }
    );
    const wishlist = wishlistData?.customer?.wishlists?.[0];
    const wishlistedProductUids = new Set(
        (wishlist?.items_v2?.items || []).map(item => item.product.uid)
    );
    const wishlistItemIdByProductUid = new Map(
        (wishlist?.items_v2?.items || []).map(item => [
            item.product.uid,
            item.id
        ])
    );
    const [addToWishlist] = useMutation(ADD_TO_WISHLIST);
    const [removeFromWishlist] = useMutation(REMOVE_FROM_WISHLIST);

    const handleToggleWishlist = async product => {
        if (!isSignedIn) {
            // No sidebar/account panel reachable from here — send them to
            // sign in rather than silently doing nothing.
            history.push('/');
            return;
        }
        if (!wishlist) return;
        try {
            if (wishlistedProductUids.has(product.uid)) {
                await removeFromWishlist({
                    variables: {
                        wishlistId: wishlist.id,
                        itemIds: [wishlistItemIdByProductUid.get(product.uid)]
                    }
                });
            } else {
                await addToWishlist({
                    variables: { wishlistId: wishlist.id, sku: product.sku }
                });
            }
            refetchWishlist();
        } catch (e) {
            // Error surfaced via Apollo's error link toast.
        }
    };

    // --- Filters: write straight to the URL, in the exact param shape
    // Peregrine's own useCategory (the parent, unmodified) already reads
    // via getFiltersFromSearch — so applying a filter here immediately
    // and correctly re-runs the real product query, no extra wiring. ---
    const applyFilter = (group, items_) => {
        const nextParams = new URLSearchParams(location.search);
        nextParams.delete(`${group}[filter]`);
        items_.forEach(({ title, value }) => {
            nextParams.append(`${group}[filter]`, `${title},${value}`);
        });
        history.push({ search: `?${nextParams.toString()}` });
    };

    const toggleOptionFilter = (group, option) => {
        const current = activeUrlFilters.get(group) || new Set();
        const existingEntry = Array.from(current).find(v =>
            v.endsWith(`,${option.value}`)
        );
        const nextItems = [];
        for (const v of current) {
            if (v !== existingEntry) {
                const [title, value] = v.split(',');
                nextItems.push({ title, value });
            }
        }
        if (!existingEntry) {
            nextItems.push({ title: decodeHtmlEntities(option.label), value: option.value });
        }
        applyFilter(group, nextItems);
    };

    const isOptionActive = (group, value) => {
        const current = activeUrlFilters.get(group);
        if (!current) return false;
        return Array.from(current).some(v => v.endsWith(`,${value}`));
    };

    const applyPriceFilter = (from, to) => {
        applyFilter('price', [
            {
                title: `${from}-${to}`,
                value: `${from}_${to}`
            }
        ]);
    };

    const clearAllFilters = () => {
        history.push({ search: '' });
    };

    const removeFilterTag = (group, value) => {
        const current = activeUrlFilters.get(group) || new Set();
        const nextItems = [];
        for (const v of current) {
            const [title, val] = v.split(',');
            if (val !== value) nextItems.push({ title, value: val });
        }
        applyFilter(group, nextItems);
    };

    const appliedFilterTags = [];
    for (const [group, values] of activeUrlFilters.entries()) {
        for (const v of values) {
            const [title, value] = v.split(',');
            appliedFilterTags.push({ group, title, value });
        }
    }

    const colorFilter = filters?.find(f => f.attribute_code === 'color');
    const sizeFilter = filters?.find(f => f.attribute_code === 'size');
    const priceFilter = filters?.find(f => f.attribute_code === 'price');

    // Every other real aggregation the catalog returns for this
    // category (material, activity, climate, pattern, sale, new, ...) —
    // "category_id"/"category_uid" is skipped since the dedicated
    // Category widget below already covers that with real counts and
    // real links, from its own query.
    const otherFilters = (filters || []).filter(
        f =>
            !DEDICATED_FILTER_CODES.includes(f.attribute_code) &&
            f.attribute_code !== 'category_id' &&
            f.attribute_code !== 'category_uid'
    );

    // Real min/max for the slider, derived from the price aggregation's
    // own buckets (e.g. "30-40", "90-100") rather than a hardcoded range
    // like the theme's own demo (start: [40, 346], range: 0-400).
    const priceBounds = useMemo(() => {
        if (!priceFilter?.options?.length) return null;
        let lo = Infinity;
        let hi = -Infinity;
        for (const option of priceFilter.options) {
            const nums = (option.value.match(/[\d.]+/g) || []).map(Number);
            if (nums.length) {
                lo = Math.min(lo, ...nums);
                hi = Math.max(hi, ...nums);
            }
        }
        return Number.isFinite(lo) && Number.isFinite(hi) && lo < hi
            ? { min: Math.floor(lo), max: Math.ceil(hi) }
            : null;
    }, [priceFilter]);

    // An already-applied "price[filter]" URL value (e.g. "40_100") sets
    // the slider's starting handle positions instead of always
    // resetting to the full bounds.
    const appliedPriceRange = useMemo(() => {
        const current = activeUrlFilters.get('price');
        if (!current) return null;
        const [firstValue] = current;
        if (!firstValue) return null;
        const [, value] = firstValue.split(',');
        const [from, to] = (value || '').split('_').map(Number);
        return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
    }, [activeUrlFilters]);

    // Real currency, derived from a real product's own price data
    // already on the page — avoids a separate storeConfig query just
    // for a currency code the product data already carries.
    const currencyCode =
        items?.find(Boolean)?.price_range?.maximum_price?.final_price?.currency;

    const handleSortChange = sortValue => {
        const method = availableSortMethods?.find(m => m.value === sortValue);
        if (method) {
            setCurrentSort({
                sortText: method.label,
                sortAttribute: method.value,
                sortDirection: currentSort.sortDirection
            });
        }
    };

    const pageNumbers = pageControl?.totalPages
        ? Array.from({ length: pageControl.totalPages }, (_, i) => i + 1)
        : [];

    return (
        <div className="moon-cart-category-page">
            {/* banner */}
            <div className="dz-bnr-inr style-1">
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>{categoryName || 'Shop'}</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <Breadcrumbs categoryId={categoryId} />
                        </nav>
                    </div>
                </div>
            </div>

            <section className="content-inner-1 pt-3 z-index-unset">
                <div className="container-fluid">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-20 col-xl-3">
                            <div className="shop-filter mt-xl-2 mt-0">
                                <aside>
                                    <div className="d-flex align-items-center justify-content-between m-b30">
                                        <h6 className="title mb-0 fw-normal">Filter</h6>
                                    </div>

                                    <div className="widget widget_search">
                                        <form
                                            className="form-group"
                                            onSubmit={e => {
                                                e.preventDefault();
                                                const query = e.target.dzSearch.value.trim();
                                                if (query) {
                                                    history.push(
                                                        `/search.html?query=${encodeURIComponent(
                                                            query
                                                        )}`
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="input-group">
                                                <input
                                                    name="dzSearch"
                                                    type="search"
                                                    className="form-control"
                                                    placeholder="Search Product"
                                                />
                                                <div className="input-group-addon">
                                                    <button type="submit" className="btn">
                                                        <i className="ti-search" />
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {priceBounds && (
                                        <div className="widget">
                                            <h6 className="widget-title">Price</h6>
                                            <PriceRangeSlider
                                                min={priceBounds.min}
                                                max={priceBounds.max}
                                                valueMin={
                                                    appliedPriceRange
                                                        ? appliedPriceRange.from
                                                        : priceBounds.min
                                                }
                                                valueMax={
                                                    appliedPriceRange
                                                        ? appliedPriceRange.to
                                                        : priceBounds.max
                                                }
                                                currencyCode={currencyCode}
                                                onChangeCommitted={applyPriceFilter}
                                            />
                                        </div>
                                    )}

                                    {colorFilter && (
                                        <div className="widget">
                                            <h6 className="widget-title">Color</h6>
                                            <div className="d-flex align-items-center flex-wrap color-filter ps-2">
                                                {colorFilter.options.map(option => {
                                                    const hex = colorSwatchHex[option.value];
                                                    const active = isOptionActive('color', option.value);
                                                    return (
                                                        <div
                                                            className="form-check"
                                                            key={option.value}
                                                            title={decodeHtmlEntities(option.label)}
                                                        >
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={active}
                                                                onChange={() =>
                                                                    toggleOptionFilter('color', option)
                                                                }
                                                                aria-label={decodeHtmlEntities(option.label)}
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
                                        </div>
                                    )}

                                    {sizeFilter && (
                                        <div className="widget">
                                            <h6 className="widget-title">Size</h6>
                                            <div className="btn-group product-size flex-wrap">
                                                {sizeFilter.options.map(option => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        className={
                                                            'btn btn-sm ' +
                                                            (isOptionActive('size', option.value)
                                                                ? 'btn-secondary'
                                                                : 'btn-outline-secondary')
                                                        }
                                                        onClick={() => toggleOptionFilter('size', option)}
                                                    >
                                                        {decodeHtmlEntities(option.label)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {otherFilters.map(filter => (
                                        <div className="widget" key={filter.attribute_code}>
                                            <h6 className="widget-title">
                                                {decodeHtmlEntities(filter.label)}
                                            </h6>
                                            <div
                                                className="d-flex align-items-center flex-wrap"
                                                style={{ gap: 8 }}
                                            >
                                                {filter.options.map(option => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        className={
                                                            'btn btn-sm ' +
                                                            (isOptionActive(
                                                                filter.attribute_code,
                                                                option.value
                                                            )
                                                                ? 'btn-secondary'
                                                                : 'btn-outline-secondary')
                                                        }
                                                        onClick={() =>
                                                            toggleOptionFilter(
                                                                filter.attribute_code,
                                                                option
                                                            )
                                                        }
                                                    >
                                                        {decodeHtmlEntities(option.label)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {subcategories.length > 0 && (
                                        <div className="widget widget_categories">
                                            <h6 className="widget-title">Category</h6>
                                            <ul>
                                                {subcategories.map(cat => (
                                                    <li className="cat-item" key={cat.uid}>
                                                        <a
                                                            href="#"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                history.push(
                                                                    resourceUrl(`/${cat.url_path}`)
                                                                );
                                                            }}
                                                        >
                                                            {cat.name}
                                                        </a>{' '}
                                                        ({cat.product_count})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {appliedFilterTags.length > 0 && (
                                        <a
                                            href="#"
                                            className="btn btn-sm font-14 btn-primary btn-sharp"
                                            onClick={e => {
                                                e.preventDefault();
                                                clearAllFilters();
                                            }}
                                        >
                                            RESET
                                        </a>
                                    )}
                                </aside>
                            </div>
                        </div>

                        {/* Main content */}
                        <div className="col-80 col-xl-9">
                            <div className="filter-wrapper">
                                <div className="filter-left-area">
                                    {appliedFilterTags.length > 0 && (
                                        <ul className="filter-tag">
                                            {appliedFilterTags.map(tag => (
                                                <li key={`${tag.group}-${tag.value}`}>
                                                    <a
                                                        href="#"
                                                        className="tag-btn"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            removeFilterTag(tag.group, tag.value);
                                                        }}
                                                    >
                                                        {tag.title}
                                                        <i className="icon feather icon-x tag-close" />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <span>
                                        {totalCount != null
                                            ? `Showing ${Math.min(
                                                  (pageControl.currentPage - 1) * pageSize + 1,
                                                  totalCount
                                              )}–${Math.min(
                                                  pageControl.currentPage * pageSize,
                                                  totalCount
                                              )} Of ${totalCount} Results`
                                            : isLoading
                                            ? 'Loading…'
                                            : ''}
                                    </span>
                                </div>
                                <div className="filter-right-area">
                                    {availableSortMethods && (
                                        <div className="form-group">
                                            <ThemeSelect
                                                value={currentSort.sortAttribute}
                                                options={availableSortMethods}
                                                onChange={handleSortChange}
                                            />
                                        </div>
                                    )}
                                    <ShopViewSwitcher value={viewMode} onChange={setViewMode} />
                                </div>
                            </div>

                            {categoryDescription && (
                                <div
                                    className="category-description mb-4"
                                    dangerouslySetInnerHTML={{
                                        __html: normalizeCmsHtml(categoryDescription)
                                    }}
                                />
                            )}

                            {totalPagesFromData === null && !isLoading ? (
                                <p>No products were found matching your selection.</p>
                            ) : (
                                <>
                                    {viewMode === 'collage' ? (
                                        <CategoryProductCollage
                                            items={items}
                                            wishlistedProductUids={wishlistedProductUids}
                                            onToggleWishlist={handleToggleWishlist}
                                            isInCompare={isInCompare}
                                            onToggleCompare={toggleCompare}
                                            onQuickView={setQuickViewProduct}
                                        />
                                    ) : (
                                        <div className={VIEW_CONFIG[viewMode].rowClass}>
                                            {items.map((product, index) => {
                                                const { colClass, placeholderClass, Card } = VIEW_CONFIG[
                                                    viewMode
                                                ];
                                                return product ? (
                                                    <div className={colClass} key={product.uid}>
                                                        <Card
                                                            product={product}
                                                            isWishlisted={wishlistedProductUids.has(
                                                                product.uid
                                                            )}
                                                            onToggleWishlist={() =>
                                                                handleToggleWishlist(product)
                                                            }
                                                            isInCompare={isInCompare(product.uid)}
                                                            onToggleCompare={toggleCompare}
                                                            onQuickView={setQuickViewProduct}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={colClass}
                                                        key={`placeholder-${index}`}
                                                    >
                                                        <div className={placeholderClass} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {pageNumbers.length > 1 && (
                                        <ul className="pagination style-1">
                                            <li>
                                                <button
                                                    type="button"
                                                    className="page-link"
                                                    disabled={pageControl.currentPage <= 1}
                                                    onClick={() =>
                                                        pageControl.setPage(
                                                            pageControl.currentPage - 1
                                                        )
                                                    }
                                                >
                                                    Prev
                                                </button>
                                            </li>
                                            {pageNumbers.map(pageNumber => (
                                                <li key={pageNumber}>
                                                    <button
                                                        type="button"
                                                        className={
                                                            'page-link' +
                                                            (pageNumber === pageControl.currentPage
                                                                ? ' active'
                                                                : '')
                                                        }
                                                        onClick={() =>
                                                            pageControl.setPage(pageNumber)
                                                        }
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                </li>
                                            ))}
                                            <li>
                                                <button
                                                    type="button"
                                                    className="page-link"
                                                    disabled={
                                                        pageControl.currentPage >=
                                                        pageControl.totalPages
                                                    }
                                                    onClick={() =>
                                                        pageControl.setPage(
                                                            pageControl.currentPage + 1
                                                        )
                                                    }
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {iconBoxHtml && (
                <section
                    className="content-inner py-0"
                    dangerouslySetInnerHTML={{ __html: iconBoxHtml }}
                />
            )}

            <QuickViewModal
                product={quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                isWishlisted={
                    quickViewProduct
                        ? wishlistedProductUids.has(quickViewProduct.uid)
                        : false
                }
                onToggleWishlist={() =>
                    quickViewProduct && handleToggleWishlist(quickViewProduct)
                }
                isInCompare={quickViewProduct ? isInCompare(quickViewProduct.uid) : false}
                onToggleCompare={() =>
                    quickViewProduct && toggleCompare(quickViewProduct)
                }
            />

            {/*
                Not a theme element — the theme's own SCSS has a
                Compare page design (_compare.scss) but never designed
                any UI to actually get there, since Compare isn't part
                of its demo. This small bar is the minimum needed to
                make the feature discoverable/usable at all.
            */}
            {compareCount > 0 && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: '#24262B',
                        color: '#fff',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16
                    }}
                >
                    <span>
                        {compareCount} product{compareCount === 1 ? '' : 's'} selected
                        to compare
                    </span>
                    <a
                        href="/compare"
                        className="btn btn-sm btn-secondary"
                        onClick={e => {
                            e.preventDefault();
                            history.push('/compare');
                        }}
                    >
                        Compare Now
                    </a>
                </div>
            )}
        </div>
    );
};

export default CategoryContent;
