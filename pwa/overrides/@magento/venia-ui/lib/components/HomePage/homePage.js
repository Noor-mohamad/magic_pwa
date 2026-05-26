import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight } from 'react-feather';
import './homePage.css';

const CDN = 'https://static.helioswatchstore.com';
const WYS = 'https://www.helioswatchstore.com/media/wysiwyg/homepage/newdesign';

/* ── static data ─────────────────────────────────────────────────────────── */

const HERO_SLIDES = [
    {
        desktop: `${CDN}/media/sparsh/banner/image/d/e/desk_slider2_ar_progressive_1.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/m/o/mob_slider2_ar_progressive_1.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/a/r/ar_white.png`,
        title:   'Celestial Designs Rooted In Classic Horology',
        cta:     'VIEW COLLECTION',
        link:    '/watches/auguste-reymond',
    },
    {
        desktop: `${CDN}/media/sparsh/banner/image/t/i/tissot_progressive.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/t/i/tissot_progressive_mobile.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/t/s/ts_logo.png`,
        title:   'Classic design, powered by Swiss excellence',
        cta:     'VIEW COLLECTION',
        link:    '/watches/tissot',
    },
    {
        desktop: `${CDN}/media/sparsh/banner/image/d/e/desk_slider1_as_progressive.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/m/o/mob_slider1_as_progressive.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/a/s/as_white.png`,
        title:   'Avant-garde dials as wearable art',
        cta:     'VIEW COLLECTION',
        link:    '/watches/alexander-shorokhoff',
    },
    {
        desktop: `${CDN}/media/sparsh/banner/image/d/e/desk_slider3_hl_progressive.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/m/o/mob_slider3_hl_1_progressive.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/h/l/hl_logo.png`,
        title:   'Effortless timepieces refined by Swiss precision',
        cta:     'VIEW COLLECTION',
        link:    '/watches/herbelin',
    },
    {
        desktop: `${CDN}/media/sparsh/banner/image/d/e/desk_slider4_ra_progressive.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/m/o/mob_slider4_ra_progressive.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/r/a/rado_logo_1_.png`,
        title:   'Designs engineered with materials that defy time',
        cta:     'VIEW COLLECTION',
        link:    '/watches/rado',
    },
    {
        desktop: `${CDN}/media/sparsh/banner/image/d/e/desk_slider5_cl_progressive_1_.jpg`,
        mobile:  `${CDN}/media/sparsh/banner/image/m/o/mob_slider5_cl_progressive_1_.jpg`,
        brand:   `${CDN}/media/tmp/catalog/product/c/o/co_logo.png`,
        title:   'Sculpted by iconic cable design',
        cta:     'VIEW COLLECTION',
        link:    '/watches/charriol',
    },
];

const BADGES = [
    { img: `${CDN}/media/easyslide/A_TITAN_Brand.png`,            label: 'A TITAN Brand',              link: '/' },
    { img: `${CDN}/media/easyslide/Free_Battery_Replacement.png`, label: 'Free Battery Replacement',   link: '/battery-replacement/' },
    { img: `${CDN}/media/easyslide/TATA_NEU_Points_1.png`,        label: 'Earn TATA NEU Points',        link: '/encircle-points/' },
    { img: `${CDN}/media/easyslide/Track_Your_Order.png`,         label: 'Track Your Order',            link: '/tracking/' },
];

const CELEBRITIES = [
    {
        img:      `${CDN}/media/easyslide/1RagaGlimmers_1.jpg`,
        brandImg: `${WYS}/RG_lb.png`,
        brandAlt: 'RAGA by TITAN',
        link:     '/watches/raga',
        products: [
            `${CDN}/media/catalog/product/n/s/ns95140km01_1.jpg`,
            `${CDN}/media/catalog/product/n/s/ns2666wm01_1.jpg`,
            `${CDN}/media/catalog/product/9/5/95139km01_1_3.jpg`,
        ],
    },
    {
        img:      `${CDN}/media/easyslide/4AugusteReymond.jpg`,
        brandImg: `${WYS}/AR_lb.png`,
        brandAlt: 'AUGUSTE REYMOND',
        link:     '/watches/auguste-reymond',
        products: [
            `${CDN}/media/catalog/product/a/r/arun04a002501203_1.jpg`,
            `${CDN}/media/catalog/product/a/r/ar798666101_1.jpg`,
            `${CDN}/media/catalog/product/a/r/arhe04q001001001_1.jpg`,
        ],
    },
    {
        img:      `${CDN}/media/easyslide/7Titan2_2.jpg`,
        brandImg: `${WYS}/TT_lb.png`,
        brandAlt: 'TITAN',
        link:     '/watches/titan',
        products: [
            `${CDN}/media/catalog/product/2/7/2756wl01_1.jpg`,
            `${CDN}/media/catalog/product/2/7/2755wl01_1.jpg`,
            `${CDN}/media/catalog/product/2/6/2670wl07_1_3.jpg`,
        ],
    },
    {
        img:      `${CDN}/media/easyslide/3G-SHOCK_1.jpg`,
        brandImg: `${WYS}/GS_lb.png`,
        brandAlt: 'G-SHOCK',
        link:     '/watches/g-shock',
        products: [
            `${CDN}/media/catalog/product/g/1/g1146_1_2.jpg`,
            `${CDN}/media/catalog/product/g/1/g1166_1.jpg`,
            `${CDN}/media/catalog/product/g/1/g1249_1.jpg`,
        ],
    },
    {
        img:      `${CDN}/media/easyslide/8Police_2.jpg`,
        brandImg: `${WYS}/PO_lb.png`,
        brandAlt: 'POLICE',
        link:     '/watches/police',
        products: [
            `${CDN}/media/catalog/product/p/l/plpewgq0063002_1.jpg`,
            `${CDN}/media/catalog/product/p/l/plpewgc0052406_1.jpg`,
            `${CDN}/media/catalog/product/p/l/plpewge1601801_1.jpg`,
        ],
    },
    {
        img:      `${CDN}/media/easyslide/11Fossil_2.jpg`,
        brandImg: `${WYS}/FO_lb.png`,
        brandAlt: 'FOSSIL',
        link:     '/watches/fossil',
        products: [
            `${CDN}/media/catalog/product/f/s/fs4835-1.jpg`,
            `${CDN}/media/catalog/product/m/e/me3171_1.jpg`,
            `${CDN}/media/catalog/product/f/s/fs5380-1.jpg`,
        ],
    },
];

const PRODUCTS_MEN = [
    {
        img:   `${CDN}/media/catalog/product/t/1/t1374101104100_1_3.jpg`,
        brand: 'TISSOT',
        sub:   'Men | T-Classic',
        price: '₹28,995',
        link:  '/watches/tissot',
    },
    {
        img:   `${CDN}/media/catalog/product/s/r/srpd63k1_1_1.jpg`,
        brand: 'SEIKO',
        sub:   'Men | 5 Sports',
        price: '₹21,495',
        link:  '/watches/seiko',
    },
    {
        img:   `${CDN}/media/catalog/product/k/c/kcwgl2122303mn_1_2.jpg`,
        brand: 'KENNETH COLE',
        sub:   'Men | Fun Loving Round',
        price: '₹12,995',
        link:  '/watches/kenneth-cole',
    },
];

const PRODUCTS_WOMEN = [
    {
        img:   `${CDN}/media/catalog/product/n/s/ns95140km01_1.jpg`,
        brand: 'RAGA',
        sub:   'Women | Moments of Joy',
        price: '₹14,995',
        link:  '/watches/raga',
    },
    {
        img:   `${CDN}/media/catalog/product/j/c/jc1l373m1065_1.jpg`,
        brand: 'JUST CAVALLI',
        sub:   'Women | Vetra Oval Silver',
        price: '₹18,750',
        link:  '/watches/just-cavalli',
    },
    {
        img:   `${CDN}/media/catalog/product/2/5/25200139_1_3.jpg`,
        brand: 'CALVIN KLEIN',
        sub:   'Women | Minimalistic',
        price: '₹22,500',
        link:  '/watches/calvin-klein',
    },
];

const BRANDS = [
    { name: 'Aigner',               img: `${CDN}/media/shop_by_brand/a/i/aigner_logo_black.png`,              link: '/watches/aigner' },
    { name: 'Alexander Shorokhoff', img: `${CDN}/media/shop_by_brand/a/l/alexander_shorokoff_logo_black.png`, link: '/watches/alexander-shorokhoff' },
    { name: 'Amazfit',              img: `${CDN}/media/shop_by_brand/a/m/amazefit_logo_black.png`,             link: '/watches/amazfit' },
    { name: 'Anne Klein',           img: `${CDN}/media/shop_by_brand/a/n/anne_klein_logo_black.png`,           link: '/watches/anne-klein' },
    { name: 'Armani Exchange',      img: `${CDN}/media/shop_by_brand/a/r/armani_exchanger_logo_black.png`,     link: '/watches/armani-exchange' },
    { name: 'Auguste Reymond',      img: `${CDN}/media/shop_by_brand/a/u/august_raymonde_logo_black.png`,      link: '/watches/auguste-reymond' },
    { name: 'Balmain',              img: `${CDN}/media/shop_by_brand/b/a/balmain_logo_black.png`,              link: '/watches/balmain' },
    { name: 'Baume & Mercier',      img: `${CDN}/media/shop_by_brand/b/a/baume_mercier_logo_black_2.png`,      link: '/watches/baume-mercier' },
    { name: 'BOSS',                 img: `${CDN}/media/shop_by_brand/b/o/boss_logo_black_1.png`,               link: '/watches/boss' },
    { name: 'Calvin Klein',         img: `${CDN}/media/shop_by_brand/c/a/calvin_klein_logo_black.png`,         link: '/watches/calvin-klein' },
    { name: 'Casio',                img: `${CDN}/media/shop_by_brand/c/a/casio_logo_black.png`,                link: '/watches/casio' },
    { name: 'Cerruti 1881',         img: `${CDN}/media/shop_by_brand/c/e/cerruti_logo_black.png`,              link: '/watches/cerruti-1881' },
    { name: 'Charriol',             img: `${CDN}/media/shop_by_brand/c/h/charriol_logo_black.png`,             link: '/watches/charriol' },
    { name: 'Citizen',              img: `${CDN}/media/shop_by_brand/c/i/citizen_logo_black.png`,              link: '/watches/citizen' },
];

const BRANDS_EXTRA = [
    { name: 'Concord',              img: `${CDN}/media/shop_by_brand/c/o/concord_logo_black.png`,              link: '/watches/concord' },
    { name: 'Daniel Wellington',    img: `${CDN}/media/shop_by_brand/d/w/dw_logo_black.png`,                   link: '/watches/daniel-wellington' },
    { name: 'Diesel',               img: `${CDN}/media/shop_by_brand/d/e/deisel_logo_black.png`,               link: '/watches/diesel' },
    { name: 'Ebel',                 img: `${CDN}/media/shop_by_brand/e/b/ebel_logo_black_1.png`,               link: '/watches/ebel' },
    { name: 'Emporio Armani',       img: `${CDN}/media/shop_by_brand/e/m/emporio_armani_logo_black.png`,       link: '/watches/emporio-armani' },
    { name: 'Fossil',               img: `${CDN}/media/shop_by_brand/f/o/fossil_logo_black.png`,               link: '/watches/fossil' },
    { name: 'G-Shock',              img: `${CDN}/media/shop_by_brand/g/_/g_shock_logo_black.png`,              link: '/watches/g-shock' },
    { name: 'Garmin',               img: `${CDN}/media/shop_by_brand/g/a/garmin_logo_black.png`,               link: '/watches/garmin' },
    { name: 'GC',                   img: `${CDN}/media/shop_by_brand/g/c/gc_logo_black.png`,                   link: '/watches/gc' },
    { name: 'Guess',                img: `${CDN}/media/shop_by_brand/g/u/guess_logo_black.png`,                link: '/watches/guess' },
    { name: 'Michael Kors',         img: `${CDN}/media/shop_by_brand/m/i/micheal_kors_logo_black.png`,         link: '/watches/michael-kors' },
    { name: 'Movado',               img: `${CDN}/media/shop_by_brand/m/o/movada_logo_black.png`,               link: '/watches/movado' },
    { name: 'Rado',                 img: `${CDN}/media/shop_by_brand/r/a/rado_logo_black_1.png`,               link: '/watches/rado' },
    { name: 'Seiko',                img: `${CDN}/media/shop_by_brand/s/e/seiko_logo_black.png`,                link: '/watches/seiko' },
    { name: 'Tissot',               img: `${CDN}/media/shop_by_brand/t/i/tissot_logo_black_1.png`,             link: '/watches/tissot' },
    { name: 'Titan',                img: `${CDN}/media/shop_by_brand/t/i/titan_logo_black.png`,                link: '/watches/titan' },
];

const COLLECTORS = [
    { img: `${CDN}/media/catalog/product/k/c/kcwgl2122303mn_1_2.jpg`,  name: 'Kenneth Cole Men Fun Loving Round...', link: '/watches/kenneth-cole' },
    { img: `${CDN}/media/catalog/product/s/r/srpd63k1_1_1.jpg`,         name: 'Seiko Men 5 Sports – Round Green...',  link: '/watches/seiko' },
    { img: `${CDN}/media/catalog/product/j/c/jc1l373m1065_1.jpg`,       name: 'Just Cavalli Women – Vetra Oval...',   link: '/watches/just-cavalli' },
    { img: `${CDN}/media/catalog/product/t/1/t1374101104100_1_3.jpg`,   name: 'Tissot Men T-Classic Round Blue',      link: '/watches/tissot' },
    { img: `${CDN}/media/catalog/product/t/1/t1374071135100_1_2.jpg`,   name: 'Tissot Men T-Classic – Tonneau...',    link: '/watches/tissot' },
];

const PROMISE = [
    { img: `${CDN}/media/easyslide/100__authentic_timepieces_.jpg`, label: '100% Authentic Timepieces' },
    { img: `${CDN}/media/easyslide/after_sale_support_.jpg`,         label: 'After Sale Support' },
    { img: `${CDN}/media/easyslide/titan_s_trust_.jpg`,              label: "Titan's Trust" },
];

const LANGUAGE_FEATURED = {
    img:   `${CDN}/media/magefan_blog/ENDURANCE_RESERVE_TIMEPIECES_530_x_600_.jpg`,
    title: 'The Mastery Of Endurance Reserve Timepieces: A Guide To Premium Automatic Watches',
    link:  '/blog',
};

const LANGUAGE_ARTICLES = [
    { img: `${CDN}/media/magefan_blog/wild530x600.jpg`,    title: 'Wild Prints, Fierce Time: Exploring the Signature Style of Roberto Cavalli Watches', date: 'May 10, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/iconic530x600.jpg`,  title: 'Iconic Concord Watches Every Luxury Watch Lover Should Know',                         date: 'May 05, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/luxury530x600.jpg`,  title: 'Luxury Automatic Watches That Are Worth the Investment',                              date: 'April 30, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/whyuboat530x600.png`,title: 'Why U-Boat Automatic Watches for Men Are a Statement of Mechanical Power',            date: 'April 25, 2026', link: '/blog' },
];

const GALLERY_ITEMS = [
    { img: `${CDN}/media/catalog/product/s/t/st25p.500.002_1.jpg`,   name: 'Charriol Women St Tropez Round',   link: '/watches/charriol' },
    { img: `${CDN}/media/catalog/product/a/x/ax2716-3p-1.jpg`,       name: 'Armani Exchange Cayde',            link: '/watches/armani-exchange' },
    { img: `${CDN}/media/catalog/product/j/c/jc1l373m1055_1.jpg`,    name: 'Just Cavalli Women Vetra Oval',    link: '/watches/just-cavalli' },
    { img: `${CDN}/media/catalog/product/m/k/mk4594_1_2.jpg`,        name: 'Michael Kors Women Pyper Round',   link: '/watches/michael-kors' },
    { img: `${CDN}/media/catalog/product/r/3/r32280203_1.jpg`,       name: 'Rado Men Hyperchrome Round',       link: '/watches/rado' },
];

const CHRONICLES = [
    { img: `${CDN}/media/magefan_blog/2_2.jpg`,                            title: 'Moonphase vs Power Reserve Watches: Which Complication Makes More Sense in India?', date: 'May 20, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/Ceramic_vs_Steel_Watches.jpg`,       title: 'Ceramic vs Steel Watches: Which Material Is Better for Indian Buyers?',             date: 'May 18, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/2_1.jpg`,                            title: 'Automatic vs Quartz Watch Maintenance: Which Costs More in India?',                 date: 'May 13, 2026', link: '/blog' },
    { img: `${CDN}/media/magefan_blog/Skeleton_vs_Solid_Dial_Watches_1.jpg`,title: 'Skeleton vs Solid Dial: Which Suits You in India?',                                date: 'May 13, 2026', link: '/blog' },
];

/* ── component ───────────────────────────────────────────────────────────── */

const HeliosHomePage = () => {
    const [heroIdx, setHeroIdx]       = useState(0);
    const [activeTab, setActiveTab]   = useState('men');
    const [showAllBrands, setShowAll] = useState(false);

    const products     = activeTab === 'men' ? PRODUCTS_MEN : PRODUCTS_WOMEN;
    const visibleBrands = showAllBrands ? [...BRANDS, ...BRANDS_EXTRA] : BRANDS;
    const slide        = HERO_SLIDES[heroIdx];

    return (
        <div className="hp-root">

            {/* ── Hero Slider ─────────────────────────────────────────── */}
            <section className="hp-hero">
                <img
                    src={slide.desktop}
                    alt={slide.title}
                    className="hp-hero__img"
                />
                <div className="hp-hero__overlay" />
                <div className="hp-hero__content">
                    <img src={slide.brand} alt="brand" className="hp-hero__brand-logo" />
                    <h1 className="hp-hero__title">{slide.title}</h1>
                    <Link to={slide.link} className="hp-hero__cta">{slide.cta}</Link>
                </div>
                <div className="hp-hero__dots">
                    {HERO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            className={`hp-hero__dot${i === heroIdx ? ' hp-hero__dot--active' : ''}`}
                            onClick={() => setHeroIdx(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
                <button
                    className="hp-hero__nav hp-hero__nav--prev"
                    onClick={() => setHeroIdx(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={22} />
                </button>
                <button
                    className="hp-hero__nav hp-hero__nav--next"
                    onClick={() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length)}
                    aria-label="Next slide"
                >
                    <ChevronRight size={22} />
                </button>
            </section>

            {/* ── Service Badges ──────────────────────────────────────── */}
            <section className="hp-badges">
                <div className="hp-badges__inner">
                    {BADGES.map((b, i) => (
                        <Link key={i} to={b.link} className="hp-badge">
                            <img src={b.img} alt={b.label} className="hp-badge__icon" />
                            <span className="hp-badge__label">{b.label}</span>
                            <ChevronRight size={13} className="hp-badge__arrow" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Shop The Celebrity Look ──────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">Shop The Celebrity Look</h2>
                <div className="hp-carousel-wrap">
                    <button className="hp-carousel-btn hp-carousel-btn--left" aria-label="Previous">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="hp-celebrities">
                        {CELEBRITIES.map((c, i) => (
                            <Link key={i} to={c.link} className="hp-celeb-card">
                                <img src={c.img} alt={c.brandAlt} className="hp-celeb-card__img" />
                                <div className="hp-celeb-card__footer">
                                    <img
                                        src={c.brandImg}
                                        alt={c.brandAlt}
                                        className="hp-celeb-card__brand"
                                    />
                                    <div className="hp-celeb-card__thumbs">
                                        {c.products.map((pImg, j) => (
                                            <img
                                                key={j}
                                                src={pImg}
                                                alt="watch"
                                                className="hp-celeb-card__thumb"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <button className="hp-carousel-btn hp-carousel-btn--right" aria-label="Next">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            {/* ── Signature Timepieces ────────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">Signature Timepieces</h2>
                <div className="hp-tabs">
                    <button
                        className={`hp-tab${activeTab === 'men' ? ' hp-tab--active' : ''}`}
                        onClick={() => setActiveTab('men')}
                    >MEN</button>
                    <button
                        className={`hp-tab${activeTab === 'women' ? ' hp-tab--active' : ''}`}
                        onClick={() => setActiveTab('women')}
                    >WOMEN</button>
                </div>
                <div className="hp-carousel-wrap">
                    <button className="hp-carousel-btn hp-carousel-btn--left" aria-label="Previous">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="hp-products">
                        {products.map((p, i) => (
                            <Link key={i} to={p.link} className="hp-product-card">
                                <button
                                    className="hp-product-card__wish"
                                    aria-label="Add to wishlist"
                                    onClick={e => e.preventDefault()}
                                >
                                    <Heart size={17} />
                                </button>
                                <img src={p.img} alt={p.brand} className="hp-product-card__img" />
                                <div className="hp-product-card__info">
                                    <h4 className="hp-product-card__brand">{p.brand}</h4>
                                    <p className="hp-product-card__sub">{p.sub}</p>
                                    <p className="hp-product-card__price">{p.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <button className="hp-carousel-btn hp-carousel-btn--right" aria-label="Next">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>

            {/* ── Icons Of Time ───────────────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">Icons Of Time</h2>
                <div className="hp-brands-grid">
                    {visibleBrands.map((b, i) => (
                        <Link key={i} to={b.link} className="hp-brand-cell">
                            <img src={b.img} alt={b.name} className="hp-brand-cell__img" />
                        </Link>
                    ))}
                </div>
                {!showAllBrands && (
                    <div className="hp-center">
                        <button className="hp-btn-outline" onClick={() => setShowAll(true)}>
                            SHOW MORE
                        </button>
                    </div>
                )}
            </section>

            {/* ── The House Of Time ───────────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">The House Of Time</h2>
                <p className="hp-section-sub">Discover a curated selection of watches from your nearest Helios boutique</p>
                <div className="hp-store-wrap">
                    <img
                        src={`${CDN}/media/easyslide/storebanner.jpg`}
                        alt="Helios store"
                        className="hp-store-img"
                    />
                </div>
                <div className="hp-center" style={{ marginTop: 24 }}>
                    <Link to="/store-locator/storelist" className="hp-btn-teal">LOCATE NEAREST STORE</Link>
                </div>
            </section>

            {/* ── The Collector's Selection ───────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">The Collector&#x2019;s Selection</h2>
                <p className="hp-section-sub">Moments that define craft, culture, and form</p>
                <div className="hp-collectors">
                    {COLLECTORS.map((item, i) => (
                        <Link key={i} to={item.link} className="hp-collector-card">
                            <div className="hp-collector-card__img-wrap">
                                <span className="hp-collector-card__badge">HELIOS</span>
                                <img src={item.img} alt={item.name} className="hp-collector-card__img" />
                            </div>
                            <div className="hp-collector-card__foot">
                                <p className="hp-collector-card__name">{item.name}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Our Promise ─────────────────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">Our Promise</h2>
                <p className="hp-section-sub">
                    A Trusted Destination For Premium Watches Across{' '}
                    <Link to="/store-locator/storelist" className="hp-teal-link">280+ Stores</Link>
                </p>
                <div className="hp-promise-grid">
                    {PROMISE.map((item, i) => (
                        <div key={i} className="hp-promise-card">
                            <img src={item.img} alt={item.label} className="hp-promise-card__img" />
                            <p className="hp-promise-card__label">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── The Language Of Time ────────────────────────────────── */}
            <section className="hp-language">
                <div className="hp-language__inner">
                    <div className="hp-language__hdr">
                        <div>
                            <h2 className="hp-language__title">The Language Of Time</h2>
                            <p className="hp-language__sub">Insights on craft, mastery, and the pursuit of the exceptional</p>
                        </div>
                        <Link to="/blog" className="hp-btn-outline-light">VIEW ALL</Link>
                    </div>
                    <div className="hp-language__grid">
                        <Link to={LANGUAGE_FEATURED.link} className="hp-language__featured">
                            <img
                                src={LANGUAGE_FEATURED.img}
                                alt={LANGUAGE_FEATURED.title}
                                className="hp-language__feat-img"
                            />
                            <p className="hp-language__feat-title">{LANGUAGE_FEATURED.title}</p>
                        </Link>
                        <div className="hp-language__list">
                            {LANGUAGE_ARTICLES.map((a, i) => (
                                <Link key={i} to={a.link} className="hp-article">
                                    <img src={a.img} alt={a.title} className="hp-article__thumb" />
                                    <div className="hp-article__body">
                                        <h4 className="hp-article__title">{a.title}</h4>
                                        <span className="hp-article__date">{a.date}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── The Timepiece Gallery ───────────────────────────────── */}
            <section className="hp-section">
                <h2 className="hp-section-title">The Timepiece Gallery</h2>
                <p className="hp-section-sub">Where detail, craftsmanship, and character come alive.</p>
                <div className="hp-gallery">
                    {GALLERY_ITEMS.map((item, i) => (
                        <Link key={i} to={item.link} className="hp-gallery-item">
                            <img src={item.img} alt={item.name} className="hp-gallery-item__img" />
                            <p className="hp-gallery-item__name">{item.name}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Chronicles Of Time ──────────────────────────────────── */}
            <section className="hp-section">
                <div className="hp-chronicles-hdr">
                    <div>
                        <h2 className="hp-section-title hp-section-title--left">Chronicles Of Time</h2>
                        <p className="hp-section-sub hp-section-sub--left">Reflections from within the world of fine watchmaking.</p>
                    </div>
                    <Link to="/blog" className="hp-btn-outline">VIEW ALL</Link>
                </div>
                <div className="hp-carousel-wrap">
                    <button className="hp-carousel-btn hp-carousel-btn--left" aria-label="Previous">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="hp-chronicles">
                        {CHRONICLES.map((post, i) => (
                            <Link key={i} to={post.link} className="hp-chronicle-card">
                                <img src={post.img} alt={post.title} className="hp-chronicle-card__img" />
                                <h4 className="hp-chronicle-card__title">{post.title}</h4>
                                <span className="hp-chronicle-card__date">{post.date}</span>
                            </Link>
                        ))}
                    </div>
                    <button className="hp-carousel-btn hp-carousel-btn--right" aria-label="Next">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </section>

        </div>
    );
};

export default HeliosHomePage;