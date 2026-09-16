import React from 'react';

import CategoryProductCardGrid from './CategoryProductCardGrid';

/**
 * "Collage" view (shop-standard.html's "tab-list-collage" pane) —
 * groups products into 5s: one large tile ("col-lg-6") + 4 small
 * tiles in a 2x2 grid ("col-lg-6" > nested row of "col-6"s), and
 * alternates which side the large tile sits on from group to group —
 * that alternation is in the theme's own markup (group 1: big-left/
 * small-right, group 2: small-left/big-right, repeating).
 *
 * Reuses the same shop-card component as Grid/Column
 * (CategoryProductCardGrid) rather than a separate "large" card —
 * its image already fills its container (contain within a fixed
 * aspect box), so putting it in a wider column is enough to make it
 * read as the "big" tile.
 *
 * Loading-state skeleton placeholders (nulls in `items`) aren't
 * replicated pixel-for-pixel here — they're simply skipped, so the
 * collage just renders fewer tiles until real data arrives, rather
 * than reserving the exact theme skeleton shape per slot.
 */
const CategoryProductCollage = ({
    items,
    wishlistedProductUids,
    onToggleWishlist,
    isInCompare,
    onToggleCompare,
    onQuickView
}) => {
    const products = items.filter(Boolean);
    const groups = [];
    for (let i = 0; i < products.length; i += 5) {
        groups.push(products.slice(i, i + 5));
    }

    const renderCard = product => (
        <CategoryProductCardGrid
            key={product.uid}
            product={product}
            isWishlisted={wishlistedProductUids.has(product.uid)}
            onToggleWishlist={() => onToggleWishlist(product)}
            isInCompare={isInCompare(product.uid)}
            onToggleCompare={onToggleCompare}
            onQuickView={onQuickView}
        />
    );

    return (
        <>
            {groups.map((group, groupIndex) => {
                const [big, ...small] = group;

                const bigTile = big && (
                    <div className="col-lg-6" key={`big-${big.uid}`}>
                        {renderCard(big)}
                    </div>
                );

                const smallTiles = small.length > 0 && (
                    <div className="col-lg-6" key={`small-${groupIndex}`}>
                        <div className="row gx-xl-4 g-3">
                            {small.map(product => (
                                <div className="col-6" key={product.uid}>
                                    {renderCard(product)}
                                </div>
                            ))}
                        </div>
                    </div>
                );

                const bigOnRight = groupIndex % 2 === 1;

                return (
                    <div className="row mb-3 g-3" key={groupIndex}>
                        {bigOnRight ? (
                            <>
                                {smallTiles}
                                {bigTile}
                            </>
                        ) : (
                            <>
                                {bigTile}
                                {smallTiles}
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default CategoryProductCollage;
