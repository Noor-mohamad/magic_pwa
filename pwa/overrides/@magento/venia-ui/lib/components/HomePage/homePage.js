import React, { useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { normalizeCmsHtml } from '../../../../../../src/moonCartTheme/normalizeCmsHtml';

const pad = n => String(n).padStart(2, '0');

// "Deal of the month" countdown (homepage_baby_products block): counts
// down to the end of the current calendar month by default, so it stays
// accurate and resets on its own with zero admin upkeep. To target a
// specific date/time instead, add data-countdown-end="YYYY-MM-DDTHH:mm:ss"
// to the block's .countdown-timer div in Admin — no code change needed.
const getCountdownEndDate = explicitEnd => {
    if (explicitEnd) {
        const parsed = new Date(explicitEnd);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );
};

// Order matches the theme's own section order in
// theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/index.html
// (Swiper Banner -> Recent search -> Our products -> About products ->
// About products2 -> Baby products -> Baby products list -> Our Feature).
const SECTION_IDENTIFIERS = [
    'homepage_swiper_banner',
    'homepage_recent_search',
    'homepage_our_products',
    'homepage_about_products',
    'homepage_about_products_2',
    'homepage_baby_products',
    'homepage_baby_products_list',
    'homepage_our_feature'
];

const GET_HOMEPAGE_BLOCKS = gql`
    query getHomepageBlocks($identifiers: [String]!) {
        cmsBlocks(identifiers: $identifiers) {
            items {
                identifier
                content
            }
        }
    }
`;

/**
 * MoonCart homepage — CMS-block-driven.
 *
 * Venia renders this component as a sibling of MagentoRoute specifically
 * on "/" (see venia-ui's own Routes.js) — normally just to attach a
 * stylesheet, since MagentoRoute renders the actual "home" CMS page
 * content. Our Routes override (see ../Routes/routes.js) skips
 * MagentoRoute on "/" entirely and lets this component be the whole
 * homepage instead, so none of the default "home" CMS page's own title
 * placeholder shows through.
 *
 * Each section below is a full CMS block (same "one block = one
 * section" convention as the mega_menu and footer blocks), fetched in
 * one query and normalized the same way (Page Builder's HTML-escaping
 * undone via `normalizeCmsHtml`) before being injected. No Swiper.js
 * needed here — despite the "Swiper Banner" name, none of these 8
 * sections actually use a multi-slide carousel in the theme's own
 * index.html; they're all static promotional layouts.
 *
 * The "Deal of the month" countdown (homepage_baby_products) is the one
 * bit of real behavior in here — see getCountdownEndDate below.
 */
const HomePage = () => {
    const { data } = useQuery(GET_HOMEPAGE_BLOCKS, {
        variables: { identifiers: SECTION_IDENTIFIERS },
        fetchPolicy: 'cache-and-network'
    });

    const items = data?.cmsBlocks?.items || [];
    const sectionHtml = identifier =>
        normalizeCmsHtml(
            items.find(item => item.identifier === identifier)?.content
        );

    // Live "Deal of the month" countdown — the CMS content ships static
    // numbers (29/06/38/53) since it's plain HTML; this ticks them for
    // real once that markup is actually in the DOM (i.e. once `data`
    // has loaded and this section has rendered).
    useEffect(() => {
        const root = document.querySelector(
            '[data-section="homepage_baby_products"]'
        );
        const dayEl = root?.querySelector('#day');
        const hourEl = root?.querySelector('#hour');
        const minEl = root?.querySelector('#min');
        const secEl = root?.querySelector('#second');
        if (!dayEl || !hourEl || !minEl || !secEl) return;

        const endDate = getCountdownEndDate(
            root.querySelector('.countdown-timer')?.dataset.countdownEnd
        );

        const tick = () => {
            const diff = endDate.getTime() - Date.now();
            const totalSeconds = Math.max(0, Math.floor(diff / 1000));
            dayEl.textContent = pad(Math.floor(totalSeconds / 86400));
            hourEl.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
            minEl.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
            secEl.textContent = pad(totalSeconds % 60);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [data]);

    return (
        <div className="moon-cart-homepage">
            {SECTION_IDENTIFIERS.map(identifier => {
                const html = sectionHtml(identifier);
                if (!html) return null;
                return (
                    <div
                        key={identifier}
                        data-section={identifier}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            })}
        </div>
    );
};

export default HomePage;
