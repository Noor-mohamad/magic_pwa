import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, User, ShoppingBag, MapPin, Phone, Search } from 'react-feather';
import './header.css';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Search:', searchQuery);
        }
    };

    return (
        <header className="helios-header">
            {/* Top Bar */}
            <div className="helios-topbar">
                <div className="helios-topbar__inner">
                    <div className="helios-topbar__left">
                        <Link to="/store-locator/storelist" className="helios-topbar__link">
                            <MapPin size={14} strokeWidth={1.5} />
                            <span>Stores</span>
                        </Link>
                        <span className="helios-topbar__divider">|</span>
                        <Link to="/contact" className="helios-topbar__link">
                            <Phone size={14} strokeWidth={1.5} />
                            <span>Contact Us</span>
                        </Link>
                    </div>

                    <div className="helios-topbar__center">
                        <Link to="/" className="helios-logo__link">
                            <img
                                src="https://static.helioswatchstore.com/media/logo/stores/1/newhelioslogocroped.png"
                                alt="HELIOS"
                                className="helios-logo__image"
                            />
                        </Link>
                    </div>

                    <div className="helios-topbar__right">
                        <Link to="/wishlist" className="helios-topbar__icon-link" title="Wishlist">
                            <Heart size={20} strokeWidth={1.5} />
                        </Link>
                        <Link to="/account" className="helios-topbar__icon-link" title="Account">
                            <User size={20} strokeWidth={1.5} />
                        </Link>
                        <Link to="/cart" className="helios-topbar__icon-link" title="Cart">
                            <ShoppingBag size={20} strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <nav className="helios-nav">
                <div className="helios-nav__inner">
                    <div className="helios-nav__menu">
                        <Link to="/luxe" className="helios-nav__luxe">
                            <span className="helios-nav__luxe-visit">Visit</span>
                            <span className="helios-nav__luxe-brand">LUXE</span>
                        </Link>
                        <Link to="/watches" className="helios-nav__link">All Watches</Link>
                        <Link to="/mens-watches" className="helios-nav__link">Men</Link>
                        <Link to="/womens-watches" className="helios-nav__link">Women</Link>
                        <Link to="/smartwatches" className="helios-nav__link">Smart</Link>
                        <Link to="/brands" className="helios-nav__link">Brands</Link>
                        <Link to="/store-locator/storelist" className="helios-nav__link">Stores</Link>
                        <Link to="/offers" className="helios-nav__link">Offers</Link>
                    </div>

                    <form onSubmit={handleSearch} className="helios-search">
                        <Search size={16} strokeWidth={1.5} className="helios-search__icon" />
                        <input
                            type="text"
                            placeholder="Search entire store here..."
                            className="helios-search__input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
            </nav>
        </header>
    );
};

export default Header;
