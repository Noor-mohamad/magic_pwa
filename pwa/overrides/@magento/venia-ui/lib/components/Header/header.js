import React, { useEffect, useRef, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import logoDark from '../../../../../../src/moonCartTheme/images/logo.svg';
import { normalizeCmsHtml } from '../../../../../../src/moonCartTheme/normalizeCmsHtml';

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
 */
const Header = () => {
    const [isFixed, setIsFixed] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [cartTab, setCartTab] = useState('cart');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const stickyRef = useRef(null);
    const menuRef = useRef(null);

    const { data: megaMenuData } = useQuery(GET_MEGA_MENU_BLOCK, {
        fetchPolicy: 'cache-and-network'
    });
    const menuHtml = normalizeCmsHtml(megaMenuData?.cmsBlocks?.items?.[0]?.content);

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
                                    <li className="nav-item login-link">
                                        <a className="nav-link" href="#">
                                            LOGIN / REGISTER
                                        </a>
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
                                            <span className="badge badge-circle">5</span>
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
                    <form className="header-item-search" onSubmit={e => e.preventDefault()}>
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
                            <input type="text" className="form-control" aria-label="Text input with dropdown button" placeholder="Search Product" />
                            <button className="btn" type="submit">
                                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="10.0535" cy="10.5399" r="7.49047" stroke="#0D775E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15.2632 16.1387L18.1999 19.0677" stroke="#0D775E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <ul className="recent-tag">
                            <li className="pe-0"><span>Quick Search :</span></li>
                            <li><a href="#">Wooden Products</a></li>
                            <li><a href="#">Metal Products</a></li>
                            <li><a href="#">Baby Products</a></li>
                            <li><a href="#">Yoga Mats</a></li>
                        </ul>
                    </form>
                    <div className="row">
                        <div className="col-xl-12">
                            <h5 className="mb-3">You May Also Like</h5>
                            {/*
                                Theme markup used a swiper carousel here
                                (swiper/swiper-wrapper/swiper-slide), whose
                                sizing CSS lives in vendor/swiper — not
                                ported yet. Standing in with a plain
                                scroll row until real Swiper (or real
                                search-suggestion data) replaces this.
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
                                        <span className="badge badge-light">5</span>
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={'nav-link' + (cartTab === 'wishlist' ? ' active' : '')}
                                        type="button"
                                        onClick={() => setCartTab('wishlist')}
                                    >
                                        Wishlist
                                        <span className="badge badge-light">2</span>
                                    </button>
                                </li>
                            </ul>
                            <div className="tab-content pt-4">
                                <div className={'tab-pane fade' + (cartTab === 'cart' ? ' show active' : '')}>
                                    <div className="shop-sidebar-cart">
                                        <ul className="sidebar-cart-list">
                                            {[
                                                ['pic1.jpg', 'Wooden Water Bottles', '$50.00'],
                                                ['pic2.jpg', 'Bamboo Cups', '$40.00'],
                                                ['pic3.jpg', 'Wooden Toothbrushes', '$65.00']
                                            ].map(([img, title, price], i) => (
                                                <li key={i}>
                                                    <div className="cart-widget">
                                                        <div className="dz-media me-3">
                                                            {/* eslint-disable-next-line */}
                                                            <img src={require(`../../../../../../src/moonCartTheme/images/shop/shop-cart/${img}`)} alt="" />
                                                        </div>
                                                        <div className="cart-content">
                                                            <h6 className="title"><a href="#">{title}</a></h6>
                                                            <div className="d-flex align-items-center">
                                                                <div className="btn-quantity light quantity-sm me-3">
                                                                    <input type="text" defaultValue="1" readOnly />
                                                                </div>
                                                                <h6 className="dz-price text-primary mb-0">{price}</h6>
                                                            </div>
                                                        </div>
                                                        <a href="#" className="dz-close" onClick={e => e.preventDefault()}>
                                                            <i className="ti-close" />
                                                        </a>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="cart-total">
                                            <h5 className="mb-0">Subtotal:</h5>
                                            <h5 className="mb-0">300.00$</h5>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="shipping-time">
                                                <div className="dz-icon">
                                                    <i className="flaticon flaticon-ship" />
                                                </div>
                                                <div className="shipping-content">
                                                    <h6 className="title pe-4">Congratulations , you&apos;ve got free shipping!</h6>
                                                    <div className="progress">
                                                        <div className="progress-bar progress-animated border-0" style={{ width: '75%' }} role="progressbar">
                                                            <span className="sr-only">75% Complete</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <a href="#" className="btn btn-light btn-block m-b20">Checkout</a>
                                            <a href="#" className="btn btn-secondary btn-block">View Cart</a>
                                        </div>
                                    </div>
                                </div>
                                <div className={'tab-pane fade' + (cartTab === 'wishlist' ? ' show active' : '')}>
                                    <div className="shop-sidebar-cart">
                                        <ul className="sidebar-cart-list">
                                            {[
                                                ['pic1.jpg', 'Wooden Water Bottles', '$50.00'],
                                                ['pic2.jpg', 'Wooden Cup', '$40.00'],
                                                ['pic3.jpg', 'Bamboo toothbrushes', '$65.00']
                                            ].map(([img, title, price], i) => (
                                                <li key={i}>
                                                    <div className="cart-widget">
                                                        <div className="dz-media me-3">
                                                            {/* eslint-disable-next-line */}
                                                            <img src={require(`../../../../../../src/moonCartTheme/images/shop/shop-cart/${img}`)} alt="" />
                                                        </div>
                                                        <div className="cart-content">
                                                            <h6 className="title"><a href="#">{title}</a></h6>
                                                            <div className="d-flex align-items-center">
                                                                <h6 className="dz-price text-primary mb-0">{price}</h6>
                                                            </div>
                                                        </div>
                                                        <a href="#" className="dz-close" onClick={e => e.preventDefault()}>
                                                            <i className="ti-close" />
                                                        </a>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-auto">
                                            <a href="#" className="btn btn-secondary btn-block">Check Your Favourite</a>
                                        </div>
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
    );
};

export default Header;
