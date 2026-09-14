import React, { useEffect, useRef, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import { normalizeCmsHtml } from './normalizeCmsHtml';

const GET_SUBSCRIBE_POPUP_BLOCK = gql`
    query getSubscribeNowPopupBlock {
        cmsBlocks(identifiers: ["subscribe_now_popup"]) {
            items {
                identifier
                content
            }
        }
    }
`;

const DISMISSED_KEY = 'moonCartSubscribePopupDismissed';
const SHOW_DELAY_MS = 3000;

/**
 * Newsletter "Subscribe Now" popup — content comes from the
 * "subscribe_now_popup" CMS block (run through `normalizeCmsHtml`,
 * since it was saved through Page Builder and needed unwrapping/
 * decoding same as the mega menu). Shows once, 3s after page load,
 * then stays dismissed for the rest of the browser session
 * (sessionStorage) so it doesn't re-appear on every route change in
 * the SPA or every new tab.
 *
 * The block's own markup is the theme's ".inquiry-modal" component
 * (image + form side by side — see scss/components/_modal.scss), reused
 * here for the newsletter popup. That scoping class has to be present
 * on the outer .modal for its layout rules (the flex split, the dark
 * square close button, etc.) to apply at all — without it everything
 * falls back to bare Bootstrap defaults and stacks/looks unstyled.
 * Bootstrap's *CSS* is already loaded globally (compiled into
 * moonCartTheme's style.css); Bootstrap's *JS* isn't, so open/close and
 * the backdrop are plain React state here instead of data-bs-*
 * attributes.
 *
 * Rendered once, globally, from the Header override (see header.js) so
 * it survives client-side route changes rather than remounting per page.
 */
const NewsletterPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef(null);

    const { data } = useQuery(GET_SUBSCRIBE_POPUP_BLOCK, {
        fetchPolicy: 'cache-and-network'
    });
    const popupHtml = normalizeCmsHtml(data?.cmsBlocks?.items?.[0]?.content);

    useEffect(() => {
        let dismissed = false;
        try {
            dismissed = !!sessionStorage.getItem(DISMISSED_KEY);
        } catch (e) {
            // Storage unavailable (private mode, etc.) — just show it.
        }
        if (dismissed) return;

        const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const close = () => {
        setIsOpen(false);
        try {
            sessionStorage.setItem(DISMISSED_KEY, '1');
        } catch (e) {
            // Not critical if this can't be persisted.
        }
    };

    // The CMS content ships its own close button
    // (.btn-close[data-bs-dismiss="modal"]) — delegate to it since
    // Bootstrap's JS isn't loaded to wire that attribute itself.
    useEffect(() => {
        const node = contentRef.current;
        if (!node) return;

        const handleClick = e => {
            if (e.target.closest('[data-bs-dismiss="modal"]')) {
                close();
            }
        };

        node.addEventListener('click', handleClick);
        return () => node.removeEventListener('click', handleClick);
        // Re-run once the modal actually mounts (isOpen flips true) — the
        // ref is null before then, since the component renders nothing
        // while closed, so popupHtml alone changing isn't enough.
    }, [popupHtml, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = e => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen || !popupHtml) return null;

    return (
        <>
            <div
                className="modal inquiry-modal fade show"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowY: 'auto'
                }}
                tabIndex={-1}
                role="dialog"
                ref={contentRef}
                onClick={e => {
                    // Clicking the dimmed area outside .modal-dialog closes it.
                    if (e.target === e.currentTarget) close();
                }}
                dangerouslySetInnerHTML={{ __html: popupHtml }}
            />
            <div className="modal-backdrop fade show" />
        </>
    );
};

export default NewsletterPopup;
