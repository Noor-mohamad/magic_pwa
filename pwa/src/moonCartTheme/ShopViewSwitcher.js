import React from 'react';

// shop-standard.html's "#dz-shop-tab" — 4 switchable product-list
// layouts. Icon classes are the theme's own ported Flaticon font
// (see src/moonCartTheme/icons/flaticon/).
const VIEWS = [
    { key: 'list', icon: 'flaticon-list', label: 'List view' },
    { key: 'column', icon: 'flaticon-blocks', label: 'Column view' },
    { key: 'grid', icon: 'flaticon-menu', label: 'Grid view' },
    { key: 'collage', icon: 'flaticon-sections', label: 'Collage view' }
];

const ShopViewSwitcher = ({ value, onChange }) => (
    <div className="shop-tab">
        <ul className="nav" role="tablist">
            {VIEWS.map(view => (
                <li className="nav-item" role="presentation" key={view.key}>
                    <a
                        href="#"
                        className={'nav-link' + (value === view.key ? ' active' : '')}
                        role="tab"
                        aria-selected={value === view.key}
                        aria-label={view.label}
                        title={view.label}
                        onClick={e => {
                            e.preventDefault();
                            onChange(view.key);
                        }}
                    >
                        <i className={'flaticon ' + view.icon} />
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

export default ShopViewSwitcher;
