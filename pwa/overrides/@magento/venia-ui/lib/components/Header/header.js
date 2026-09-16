import React, { Suspense, useEffect, useRef, useState } from 'react';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useHistory } from 'react-router-dom';

import { useMiniCart } from '@magento/peregrine/lib/talons/MiniCart/useMiniCart';
import { useAccountTrigger } from '@magento/peregrine/lib/talons/Header/useAccountTrigger';
import { useUserContext } from '@magento/peregrine/lib/context/user';
import Price from '@magento/venia-ui/lib/components/Price';
import miniCartOperations from '@magento/venia-ui/lib/components/MiniCart/miniCart.gql';

import logoDark from '../../../../../../src/moonCartTheme/images/logo.svg';
import { normalizeCmsHtml } from '../../../../../../src/moonCartTheme/normalizeCmsHtml';
import NewsletterPopup from '../../../../../../src/moonCartTheme/NewsletterPopup';
import classes from './header.module.css';

const AccountMenu = React.lazy(() =>
    import('@magento/venia-ui/lib/components/AccountMenu')
);

const GET_MEGA_MENU_BLOCK = gql`
    query getMegaMenuBlock {
        cmsBlocks(identifiers: ["mega_menu"]) {
            items {
                identifier
                content
            }
        }
    }
`;

// Same shape as venia-ui's own AccountChip/accountChip.gql.
const GET_CUSTOMER_DETAILS = gql`
    query getMoonCartCustomerDetails {
        customer {
            firstname
        }
    }
`;

// Same shape as venia-ui's own Autocomplete query (SearchBar/autocomplete.js) —
// kept minimal since we only need enough to show name/image/price/link.
const GET_SEARCH_SUGGESTIONS = gql`
    query getMoonCartSearchSuggestions($inputText: String!) {
        products(search: $inputText, currentPage: 1, pageSize: 8) {
            items {
                uid
                name
                url_key
                small_image {
                    url
                }
                price_range {
                    maximum_price {
                        final_price {
                            value
                            currency
                        }
                    }
                }
            }
            total_count
        }
    }
`;

const GET_WISHLIST = gql`
    query getMoonCartWishlist {
        customer {
            wishlists {
                id
                items_v2(pageSize: 10) {
                    items {
                        id
                        product {
                            uid
                            name
                            url_key
                            image {
                                url
                            }
                            price_range {
                                maximum_price {
                                    final_price {
                                        value
                                        currency
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

const REMOVE_WISHLIST_ITEMS = gql`
    mutation removeMoonCartWishlistItems($wishlistId: ID!, $itemIds: [ID!]!) {
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

/**
 * MoonCart theme Header — STATIC PORT, mega menu now CMS-driven.
 *
 * This is a faithful port of the MoonCart theme's own header markup
 * (theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/index.html,
 * lines 54-613), not a rebuild on top of Venia's Header/MegaMenu/CartTrigger
 * components. Cart/search demo items and badge counts are still the
 * theme's own static demo content, unwired to Magento on purpose — real
 * data gets swapped in one section at a time, per plan.
 *
 * The main nav (Home/Shop/Blog/Pages/Contact Us, including the mega-menu
 * columns, ad banner, deal-of-month box, and blog widget) is the first
 * piece to go dynamic: its HTML now comes from the "mega_menu" CMS block
 * via the `cmsBlocks` GraphQL query, run through `normalizeCmsHtml`
 * (undoes Page Builder's HTML-escaping if the block was ever opened and
 * re-saved through its visual stage instead of "Edit HTML Code"), and
 * injected with dangerouslySetInnerHTML, so admins edit it without a
 * deploy. Because that content is raw HTML (not JSX), React isn't
 * managing its nodes —
 * the mobile "tap to expand a dropdown" behavior (theme's own custom.js:
 * click toggles `.open` on the parent <li>, closing siblings) is
 * reimplemented below as a single delegated click listener over the
 * injected markup, rather than component state.
 *
 * Bootstrap's JS (collapse/offcanvas/tab) isn't loaded — the few other
 * interactions it drove (mobile nav, offcanvas panels, cart/wishlist
 * tabs, the scroll-to-top button, "is-fixed" on scroll) are reimplemented
 * here with plain React state, toggling the theme's own CSS classes.
 *
 * Cart, account, and wishlist are now wired to real Magento data too,
 * reusing Peregrine's own talons for the data/mutation logic
 * (useMiniCart, useAccountTrigger, useUserContext) so we get real
 * cart/session behavior for free — only the presentation is ours.
 * (useCartTrigger was dropped — see the "Cart" section below.)
 * Search submits to the real `/search.html` results page and shows
 * live product matches (same query shape as venia-ui's own Autocomplete)
 * in place of the theme's demo "You May Also Like" row once 3+
 * characters are typed.
 */
const Header = () => {
    const [isFixed, setIsFixed] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartTab, setCartTab] = useState('cart');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const stickyRef = useRef(null);
    const menuRef = useRef(null);
    const history = useHistory();

    const { data: megaMenuData } = useQuery(GET_MEGA_MENU_BLOCK, {
        fetchPolicy: 'cache-and-network'
    });
    const menuHtml = normalizeCmsHtml(megaMenuData?.cmsBlocks?.items?.[0]?.content);

    // --- Account / sign-in ---------------------------------------------
    const [{ isSignedIn }] = useUserContext();
    const {
        accountMenuIsOpen,
        accountMenuRef,
        accountMenuTriggerRef,
        setAccountMenuIsOpen,
        handleTriggerClick: handleAccountTriggerClick
    } = useAccountTrigger();
    const { data: customerData } = useQuery(GET_CUSTOMER_DETAILS, {
        skip: !isSignedIn,
        fetchPolicy: 'cache-and-network'
    });
    const accountLabel = isSignedIn
        ? `HI, ${(customerData?.customer?.firstname || '').toUpperCase()}`.trim()
        : 'LOGIN / REGISTER';

    // --- Cart ------------------------------------------------------------
    // useCartTrigger isn't used here — its itemCount reads
    // `total_summary_quantity_including_config`, a field this
    // Magento instance's schema doesn't have (real GraphQL error,
    // not just unused). useMiniCart's own `totalQuantity` (below)
    // already reads the real `total_quantity` field for the exact
    // same purpose, so it's reused directly for the header badge too.
    const {
        productList: cartItems,
        subTotal,
        totalQuantity,
        handleRemoveItem: handleRemoveCartItem,
        handleProceedToCheckout,
        handleEditCart
    } = useMiniCart({
        isOpen: cartOpen,
        setIsOpen: setCartOpen,
        operations: miniCartOperations
    });

    // --- Wishlist ----------------------------------------------------------
    const { data: wishlistData, refetch: refetchWishlist } = useQuery(
        GET_WISHLIST,
        {
            skip: !isSignedIn,
            fetchPolicy: 'cache-and-network'
        }
    );
    const wishlist = wishlistData?.customer?.wishlists?.[0];
    const wishlistItems = wishlist?.items_v2?.items || [];
    const [removeWishlistItems] = useMutation(REMOVE_WISHLIST_ITEMS);
    const handleRemoveWishlistItem = async itemId => {
        if (!wishlist) return;
        try {
            await removeWishlistItems({
                variables: { wishlistId: wishlist.id, itemIds: [itemId] }
            });
            refetchWishlist();
        } catch (e) {
            // Error surfaced via Apollo's error link toast.
        }
    };

    // --- Search suggestions -----------------------------------------------
    const [runSearchSuggestions, { data: searchData }] = useLazyQuery(
        GET_SEARCH_SUGGESTIONS
    );
    const searchResults = searchData?.products?.items || [];
    useEffect(() => {
        if (searchValue.trim().length < 3) return;
        const timeout = setTimeout(() => {
            runSearchSuggestions({ variables: { inputText: searchValue } });
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchValue, runSearchSuggestions]);

    const handleSearchSubmit = e => {
        e.preventDefault();
        const query = searchValue.trim();
        if (query) {
            setSearchOpen(false);
            history.push(`/search.html?query=${encodeURIComponent(query)}`);
        }
    };

    // Header Fixed (custom.js: headerFix) + Scroll To Top visibility
    useEffect(() => {
        const handleScroll = () => {
            const top = stickyRef.current
                ? stickyRef.current.getBoundingClientRect().top + window.scrollY
                : 0;
            setIsFixed(window.scrollY > top);
            setShowScrollTop(window.scrollY > 900);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // custom.js: dzTheme() — click toggles `.open` on the clicked item's
    // <li>, closing any open sibling. Delegated on the nav container since
    // the menu markup itself comes from CMS content, not React-owned JSX.
    useEffect(() => {
        const nav = menuRef.current;
        if (!nav) return;

        const handleClick = e => {
            const link = e.target.closest('a');
            if (!link || !nav.contains(link)) return;

            const item = link.closest('li.sub-menu-down');
            // Only the top-level toggle link (its own li is a direct
            // child of the nav) opens/closes a dropdown; links inside the
            // dropdown content should navigate normally.
            if (!item || link.parentElement !== item || item.parentElement !== nav) {
                return;
            }

            e.preventDefault();
            const wasOpen = item.classList.contains('open');
            nav.querySelectorAll(':scope > li.open').forEach(li => li.classList.remove('open'));
            if (!wasOpen) {
                item.classList.add('open');
            }
        };

        nav.addEventListener('click', handleClick);
        return () => nav.removeEventListener('click', handleClick);
    }, [menuHtml]);

    const closeOffcanvas = () => {
        setSearchOpen(false);
        setCartOpen(false);
    };

    const scrollToTop = e => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
        <header
            className={
                'site-header mo-left header header-transparent' +
                (isFixed ? ' is-fixed' : '')
            }
        >
            {/* Main Header */}
            <div
                ref={stickyRef}
                className={
                    'sticky-header main-bar-wraper navbar-expand-lg' +
                    (isFixed ? ' is-fixed' : '')
                }
            >
                <div className="main-bar clearfix">
                    <div className="container-fluid clearfix">
                        {/* Website Logo */}
                        <div className="logo-header logo-dark me-md-5">
                            <a href="/">
                                <img src={logoDark} alt="logo" />
                            </a>
                        </div>

                        {/* Nav Toggle Button */}
                        <button
                            className={
                                'navbar-toggler navicon justify-content-end' +
                                (navOpen ? ' open' : ' collapsed')
                            }
                            type="button"
                            aria-label="Toggle navigation"
                            onClick={() => setNavOpen(open => !open)}
                        >
                            <span />
                            <span />
                            <span />
                        </button>

                        {/* EXTRA NAV */}
                        <div className="extra-nav">
                            <div className="extra-cell">
                                <ul className="header-right">
                                    <li
                                        className="nav-item login-link"
                                        ref={accountMenuTriggerRef}
                                        style={{ position: 'relative' }}
                                    >
                                        <a
                                            className="nav-link"
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
                                                handleAccountTriggerClick();
                                            }}
                                        >
                                            {accountLabel}
                                        </a>
                                        <Suspense fallback={null}>
                                            <AccountMenu
                                                ref={accountMenuRef}
                                                accountMenuIsOpen={accountMenuIsOpen}
                                                setAccountMenuIsOpen={setAccountMenuIsOpen}
                                                handleTriggerClick={handleAccountTriggerClick}
                                                classes={{
                                                    root_open: classes.accountMenuRoot,
                                                    root_closed: classes.accountMenuRoot,
                                                    contents: classes.accountMenuContents,
                                                    contents_open: classes.accountMenuContents
                                                }}
                                            />
                                        </Suspense>
                                    </li>
                                    <li className="nav-item search-link">
                                        <a
                                            className="nav-link"
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
                                                setSearchOpen(true);
                                            }}
                                        >
                                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="10.0535" cy="10.55" r="7.49047" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M15.2632 16.1487L18.1999 19.0778" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </a>
                                    </li>
                                    <li className="nav-item wishlist-link">
                                        <a
                                            className="nav-link"
                                            href="#"
                                            onClick={e => {
                                                e.preventDefault();
                                                setCartTab('wishlist');
                                                setCartOpen(true);
                                            }}
                                        >
                                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M2.64119 10.4097C1.74702 7.61808 2.79202 4.42724 5.72285 3.48308C7.26452 2.98558 8.96619 3.27891 10.2479 4.24308C11.4604 3.30558 13.2245 2.98891 14.7645 3.48308C17.6954 4.42724 18.747 7.61808 17.8537 10.4097C16.462 14.8347 10.2479 18.2431 10.2479 18.2431C10.2479 18.2431 4.07952 14.8864 2.64119 10.4097Z" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M13.5813 6.32781C14.473 6.61614 15.103 7.41197 15.1788 8.34614" stroke="var(--white)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </a>
                                    </li>
                                    <li className="nav-item cart-link">
                                        <a
                                            href="#"
                                            className="nav-link cart-btn"
                                            onClick={e => {
                                                e.preventDefault();
                                                setCartTab('cart');
                                                setCartOpen(true);
                                            }}
                                        >
                                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M1.08374 2.61947C1.08374 2.27429 1.36356 1.99447 1.70874 1.99447H3.29314C3.91727 1.99447 4.4722 2.39163 4.67352 2.98239L5.06379 4.1276H15.4584C17.6446 4.1276 19.4168 5.89981 19.4168 8.08593V11.5379C19.4168 13.7241 17.6446 15.4963 15.4584 15.4963H9.22182C7.30561 15.4963 5.66457 14.1237 5.32583 12.2377L4.00967 4.90953L3.49034 3.3856C3.46158 3.30121 3.3823 3.24447 3.29314 3.24447H1.70874C1.36356 3.24447 1.08374 2.96465 1.08374 2.61947ZM5.36374 5.3776L6.55614 12.0167C6.78791 13.3072 7.91073 14.2463 9.22182 14.2463H15.4584C16.9542 14.2463 18.1668 13.0337 18.1668 11.5379V8.08593C18.1668 6.59016 16.9542 5.3776 15.4584 5.3776H5.36374Z" fill="var(--white)" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M8.16479 17.8278C8.16479 17.1374 8.72444 16.5778 9.4148 16.5778H9.42313C10.1135 16.5778 10.6731 17.1374 10.6731 17.8278C10.6731 18.5182 10.1135 19.0778 9.42313 19.0778H9.4148C8.72444 19.0778 8.16479 18.5182 8.16479 17.8278Z" fill="var(--white)" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M14.8315 17.8278C14.8315 17.1374 15.3912 16.5778 16.0815 16.5778H16.0899C16.7802 16.5778 17.3399 17.1374 17.3399 17.8278C17.3399 18.5182 16.7802 19.0778 16.0899 19.0778H16.0815C15.3912 19.0778 14.8315 18.5182 14.8315 17.8278Z" fill="var(--white)" />
                                            </svg>
                                            {totalQuantity > 0 && (
                                                <span className="badge badge-circle">
                                                    {totalQuantity}
                                                </span>
                                            )}
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Main Nav */}
                        <div
                            className={
                                'header-nav navbar-collapse collapse justify-content-start' +
                                (navOpen ? ' show' : '')
                            }
                        >
                            <div className="logo-header">
                                <a href="/">
                                    <img src={logoDark} alt="" />
                                </a>
                            </div>
                            <ul
                                className="nav navbar-nav dark-nav"
                                ref={menuRef}
                                dangerouslySetInnerHTML={{ __html: menuHtml }}
                            />

                            <div className="dz-social-icon">
                                <ul>
                                    <li><a className="fab fa-facebook-f" target="_blank" rel="noreferrer" href="#" /></li>
                                    <li><a className="fab fa-twitter" target="_blank" rel="noreferrer" href="#" /></li>
                                    <li><a className="fab fa-linkedin-in" target="_blank" rel="noreferrer" href="#" /></li>
                                    <li><a className="fab fa-instagram" target="_blank" rel="noreferrer" href="#" /></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Header End */}

            {/* SearchBar */}
            <div className={'dz-search-area dz-offcanvas offcanvas offcanvas-top' + (searchOpen ? ' show' : '')}>
                <button type="button" className="btn-close" onClick={closeOffcanvas} aria-label="Close">
                    &times;
                </button>
                <div className="container">
                    <form className="header-item-search" onSubmit={handleSearchSubmit}>
                        <div className="input-group search-input">
                            <select className="default-select">
                                <option>All Categories</option>
                                <option>Wooden Bottles </option>
                                <option>Wooden Furniture</option>
                                <option>Metal Utensils</option>
                                <option>Wooden Utensils</option>
                                <option>Baby Products</option>
                                <option>Yoga Mats</option>
                                <option>Eco-Friendly</option>
                                <option>Childern&apos;s Strollers</option>
                                <option>Bamboo products</option>
                                <option>Healthy Products</option>
                                <option>Luxury Couch</option>
                                <option>Video Instructors</option>
                            </select>
                            <input
                                type="text"
                                className="form-control"
                                aria-label="Text input with dropdown button"
                                placeholder="Search Product"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                            />
                            <button className="btn" type="submit">
                                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="10.0535" cy="10.5399" r="7.49047" stroke="#0D775E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15.2632 16.1387L18.1999 19.0677" stroke="#0D775E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <ul className="recent-tag">
                            <li className="pe-0"><span>Quick Search :</span></li>
                            <li><a href="#" onClick={e => { e.preventDefault(); setSearchValue('Wooden Products'); }}>Wooden Products</a></li>
                            <li><a href="#" onClick={e => { e.preventDefault(); setSearchValue('Metal Products'); }}>Metal Products</a></li>
                            <li><a href="#" onClick={e => { e.preventDefault(); setSearchValue('Baby Products'); }}>Baby Products</a></li>
                            <li><a href="#" onClick={e => { e.preventDefault(); setSearchValue('Yoga Mats'); }}>Yoga Mats</a></li>
                        </ul>
                    </form>
                    <div className="row">
                        <div className="col-xl-12">
                            {searchValue.trim().length >= 3 ? (
                                <>
                                    <h5 className="mb-3">Search Results</h5>
                                    {searchResults.length ? (
                                        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                                            {searchResults.map(product => (
                                                <div className="shop-card" key={product.uid} style={{ flex: '0 0 180px', width: 180 }}>
                                                    <div className="dz-media">
                                                        <a href="#" onClick={e => { e.preventDefault(); setSearchOpen(false); history.push(`/${product.url_key}.html`); }}>
                                                            <img src={product.small_image?.url} alt={product.name} />
                                                        </a>
                                                    </div>
                                                    <div className="dz-content">
                                                        <h6 className="title">
                                                            <a href="#" onClick={e => { e.preventDefault(); setSearchOpen(false); history.push(`/${product.url_key}.html`); }}>
                                                                {product.name}
                                                            </a>
                                                        </h6>
                                                        <h6 className="price">
                                                            <Price
                                                                value={product.price_range.maximum_price.final_price.value}
                                                                currencyCode={product.price_range.maximum_price.final_price.currency}
                                                            />
                                                        </h6>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No products matched &quot;{searchValue}&quot;.</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h5 className="mb-3">You May Also Like</h5>
                                    {/*
                                        Theme markup used a swiper carousel here
                                        (swiper/swiper-wrapper/swiper-slide), whose
                                        sizing CSS lives in vendor/swiper — not
                                        ported yet. Standing in with a plain
                                        scroll row until real Swiper replaces this.
                                        Shown only as a default placeholder before
                                        a search term is typed; real matches take
                                        over above once 3+ characters are entered.
                                    */}
                                    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                                        {[
                                            ['1.png', 'Wooden Water Bottles', '$40.00'],
                                            ['3.png', 'Bamboo toothbrushes', '$30.00'],
                                            ['4.png', 'Eco friendly bags', '$35.00'],
                                            ['2.png', 'Wooden Cup', '$20.00'],
                                            ['5.png', 'Bamboo toothbrushes', '$70.00'],
                                            ['6.png', 'Eco friendly bags', '$45.00'],
                                            ['7.png', 'Wooden Bottles', '$40.00'],
                                            ['4.png', 'Paper Bags', '$60.00']
                                        ].map(([img, title, price], i) => (
                                            <div className="shop-card" key={i} style={{ flex: '0 0 180px', width: 180 }}>
                                                <div className="dz-media">
                                                    {/* eslint-disable-next-line */}
                                                    <img src={require(`../../../../../../src/moonCartTheme/images/shop/product/${img}`)} alt="image" />
                                                </div>
                                                <div className="dz-content">
                                                    <h6 className="title"><a href="#">{title}</a></h6>
                                                    <h6 className="price">{price}</h6>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* SearchBar */}

            {/* Sidebar cart */}
            <div className={'offcanvas dz-offcanvas offcanvas offcanvas-end' + (cartOpen ? ' show' : '')}>
                <button type="button" className="btn-close" onClick={closeOffcanvas} aria-label="Close">
                    &times;
                </button>
                <div className="offcanvas-body">
                    <div className="product-description">
                        <div className="dz-tabs">
                            <ul className="nav nav-tabs center" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={'nav-link' + (cartTab === 'cart' ? ' active' : '')}
                                        type="button"
                                        onClick={() => setCartTab('cart')}
                                    >
                                        Shopping Cart
                                        {totalQuantity > 0 && (
                                            <span className="badge badge-light">{totalQuantity}</span>
                                        )}
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={'nav-link' + (cartTab === 'wishlist' ? ' active' : '')}
                                        type="button"
                                        onClick={() => setCartTab('wishlist')}
                                    >
                                        Wishlist
                                        {wishlistItems.length > 0 && (
                                            <span className="badge badge-light">{wishlistItems.length}</span>
                                        )}
                                    </button>
                                </li>
                            </ul>
                            <div className="tab-content pt-4">
                                <div className={'tab-pane fade' + (cartTab === 'cart' ? ' show active' : '')}>
                                    <div className="shop-sidebar-cart">
                                        {cartItems?.length ? (
                                            <>
                                                <ul className="sidebar-cart-list">
                                                    {cartItems.map(item => (
                                                        <li key={item.uid}>
                                                            <div className="cart-widget">
                                                                <div className="dz-media me-3">
                                                                    <img src={item.product.thumbnail?.url} alt={item.product.name} />
                                                                </div>
                                                                <div className="cart-content">
                                                                    <h6 className="title">
                                                                        <a href="#" onClick={e => { e.preventDefault(); setCartOpen(false); history.push(`/${item.product.url_key}.html`); }}>
                                                                            {item.product.name}
                                                                        </a>
                                                                    </h6>
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="btn-quantity light quantity-sm me-3">
                                                                            <input type="text" defaultValue={item.quantity} readOnly />
                                                                        </div>
                                                                        <h6 className="dz-price text-primary mb-0">
                                                                            <Price
                                                                                value={item.prices.price.value}
                                                                                currencyCode={item.prices.price.currency}
                                                                            />
                                                                        </h6>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href="#"
                                                                    className="dz-close"
                                                                    onClick={e => {
                                                                        e.preventDefault();
                                                                        handleRemoveCartItem(item.uid);
                                                                    }}
                                                                >
                                                                    <i className="ti-close" />
                                                                </a>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="cart-total">
                                                    <h5 className="mb-0">Subtotal:</h5>
                                                    <h5 className="mb-0">
                                                        {subTotal && (
                                                            <Price value={subTotal.value} currencyCode={subTotal.currency} />
                                                        )}
                                                    </h5>
                                                </div>
                                                <div className="mt-auto">
                                                    <a href="#" className="btn btn-light btn-block m-b20" onClick={e => { e.preventDefault(); handleProceedToCheckout(); }}>Checkout</a>
                                                    <a href="#" className="btn btn-secondary btn-block" onClick={e => { e.preventDefault(); handleEditCart(); }}>View Cart</a>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="mt-3">Your cart is empty.</p>
                                        )}
                                    </div>
                                </div>
                                <div className={'tab-pane fade' + (cartTab === 'wishlist' ? ' show active' : '')}>
                                    <div className="shop-sidebar-cart">
                                        {!isSignedIn ? (
                                            <p className="mt-3">
                                                <a
                                                    href="#"
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        setCartOpen(false);
                                                        setAccountMenuIsOpen(true);
                                                    }}
                                                >
                                                    Sign in
                                                </a>{' '}
                                                to view your wishlist.
                                            </p>
                                        ) : wishlistItems.length ? (
                                            <>
                                                <ul className="sidebar-cart-list">
                                                    {wishlistItems.map(item => (
                                                        <li key={item.id}>
                                                            <div className="cart-widget">
                                                                <div className="dz-media me-3">
                                                                    <img src={item.product.image?.url} alt={item.product.name} />
                                                                </div>
                                                                <div className="cart-content">
                                                                    <h6 className="title">
                                                                        <a href="#" onClick={e => { e.preventDefault(); setCartOpen(false); history.push(`/${item.product.url_key}.html`); }}>
                                                                            {item.product.name}
                                                                        </a>
                                                                    </h6>
                                                                    <div className="d-flex align-items-center">
                                                                        <h6 className="dz-price text-primary mb-0">
                                                                            <Price
                                                                                value={item.product.price_range.maximum_price.final_price.value}
                                                                                currencyCode={item.product.price_range.maximum_price.final_price.currency}
                                                                            />
                                                                        </h6>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href="#"
                                                                    className="dz-close"
                                                                    onClick={e => {
                                                                        e.preventDefault();
                                                                        handleRemoveWishlistItem(item.id);
                                                                    }}
                                                                >
                                                                    <i className="ti-close" />
                                                                </a>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-auto">
                                                    <a
                                                        href="#"
                                                        className="btn btn-secondary btn-block"
                                                        onClick={e => { e.preventDefault(); setCartOpen(false); history.push('/wishlist'); }}
                                                    >
                                                        Check Your Favourite
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="mt-3">Your wishlist is empty.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Sidebar cart */}

            {(searchOpen || cartOpen) && (
                <div className="dz-offcanvas-backdrop" onClick={closeOffcanvas} />
            )}

            <button
                className="scroltop"
                type="button"
                style={{ display: showScrollTop ? 'flex' : 'none' }}
                onClick={scrollToTop}
            >
                <i className="fas fa-arrow-up" />
            </button>
        </header>
        <NewsletterPopup />
        </>
    );
};

export default Header;
