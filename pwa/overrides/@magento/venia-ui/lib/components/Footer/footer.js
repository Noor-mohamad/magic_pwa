import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Instagram,
    Youtube,
    Mail,
    Phone,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    ArrowRight
} from 'react-feather';
import './footer.css';

const Footer = () => {
    const [storesOpen, setStoresOpen] = useState(false);
    const [brandsOpen, setBrandsOpen] = useState(false);
    const [email, setEmail] = useState('');

    const handleNewsletter = e => {
        e.preventDefault();
        setEmail('');
    };

    return (
        <footer className="hf-root">
            {/* Accordion — Stores & Brands */}
            <div className="hf-accordion">
                <div className="hf-accordion__inner">
                    <button
                        className="hf-accordion__row"
                        onClick={() => setStoresOpen(o => !o)}
                    >
                        <span>Stores</span>
                        {storesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {storesOpen && (
                        <div className="hf-accordion__body">
                            <Link to="/stores" className="hf-accordion__link">Find a Store Near You</Link>
                        </div>
                    )}

                    <div className="hf-accordion__divider" />

                    <button
                        className="hf-accordion__row"
                        onClick={() => setBrandsOpen(o => !o)}
                    >
                        <span>Brands</span>
                        {brandsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {brandsOpen && (
                        <div className="hf-accordion__body">
                            <Link to="/brands" className="hf-accordion__link">All Brands</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Us */}
            <div className="hf-contact">
                <div className="hf-contact__inner">
                    <h3 className="hf-contact__title">Contact Us</h3>
                    <div className="hf-contact__grid">
                        {/* Grievances */}
                        <div className="hf-contact__col">
                            <div className="hf-contact__label">
                                <Mail size={14} />
                                <span>For Grievances:</span>
                            </div>
                            <a href="mailto:customercare@titan.co.in" className="hf-contact__email">
                                customercare@titan.co.in
                            </a>
                            <p className="hf-contact__line">1800 266 0123</p>
                            <p className="hf-contact__line">09:00 - 17:30 | Monday to Friday</p>
                        </div>

                        {/* Sales */}
                        <div className="hf-contact__col">
                            <div className="hf-contact__label">
                                <Phone size={14} />
                                <span>For Sales/Watch Service:</span>
                            </div>
                            <a href="mailto:heliossupport@titan.co.in" className="hf-contact__email">
                                heliossupport@titan.co.in
                            </a>
                            <p className="hf-contact__line">1800 266 0123</p>
                            <p className="hf-contact__line">09:00 - 17:30 | Monday to Friday</p>
                        </div>

                        {/* WhatsApp */}
                        <div className="hf-contact__col">
                            <div className="hf-contact__label">
                                <MessageCircle size={14} />
                                <span>Chat With Us On Whatsapp</span>
                            </div>
                            <a
                                href="https://wa.me/919355401889"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hf-whatsapp-btn"
                            >
                                CHAT NOW
                            </a>
                        </div>

                        {/* Newsletter */}
                        <div className="hf-contact__col">
                            <div className="hf-contact__label hf-contact__label--newsletter">
                                Join our newsletter to keep up to date with us!
                            </div>
                            <form className="hf-newsletter" onSubmit={handleNewsletter}>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="hf-newsletter__input"
                                />
                                <button type="submit" className="hf-newsletter__btn">
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="hf-bottom">
                <div className="hf-bottom__inner">
                    <div className="hf-bottom__links">
                        <div className="hf-link-group">
                            <h4 className="hf-link-group__title">Know Helios</h4>
                            <Link to="/about" className="hf-link-group__link">About Us</Link>
                            <Link to="/about-titan" className="hf-link-group__link">About Titan Company Ltd</Link>
                        </div>
                        <div className="hf-link-group">
                            <h4 className="hf-link-group__title">Terms &amp; Conditions</h4>
                            <Link to="/privacy-policy" className="hf-link-group__link">Privacy Policy</Link>
                            <Link to="/terms" className="hf-link-group__link">T&amp;C and FAQs</Link>
                        </div>
                        <div className="hf-link-group">
                            <h4 className="hf-link-group__title">Media</h4>
                            <Link to="/blog" className="hf-link-group__link">Blog</Link>
                        </div>
                    </div>

                    <div className="hf-bottom__brand">
                        <Link to="/" className="hf-bottom__logo-link">
                            <img
                                src="https://static.helioswatchstore.com/media/easyslide/newhelioslogowhite3.png"
                                alt="HELIOS"
                                className="hf-bottom__logo"
                            />
                        </Link>
                        <div className="hf-social">
                            <span className="hf-social__label">Follow Us On</span>
                            <div className="hf-social__icons">
                                <a
                                    href="https://www.instagram.com/helioswatches/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hf-social__icon"
                                    aria-label="Instagram"
                                >
                                    <Instagram size={18} />
                                </a>
                                <a
                                    href="https://www.youtube.com/@HeliosTheWatchStore"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hf-social__icon"
                                    aria-label="YouTube"
                                >
                                    <Youtube size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hf-copyright">
                    <p>&#169; 2026 Helios - The Watch Store. All Rights Reserved. Titan Company Limited.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;