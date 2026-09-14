import React, { useEffect, useRef, useState } from 'react';

/**
 * Replicates the theme's "bootstrap-select"-styled <select class=
 * "default-select"> (shop-standard.html loads the bootstrap-select
 * jQuery plugin to turn a plain <select> into this button+menu
 * widget — see vendor/bootstrap-select/ in the theme). That plugin
 * isn't ported, so this is a small custom dropdown that reproduces
 * just its visual shape in plain React: a ".dropdown-toggle" button
 * (its chevron already comes from the theme's own ported CSS —
 * scss/pages/_shop.scss's ".default-select .dropdown-toggle:after"
 * rule — no extra styling needed here) plus a Bootstrap ".dropdown-
 * menu", which Bootstrap's own CSS (already loaded) positions.
 */
const ThemeSelect = ({ value, options, onChange, className }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handleOutsideClick = e => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [open]);

    const selected = options.find(option => option.value === value);

    return (
        <div
            className={
                'dropdown default-select bootstrap-select' +
                (open ? ' show' : '') +
                (className ? ' ' + className : '')
            }
            ref={rootRef}
        >
            <button
                type="button"
                className="btn dropdown-toggle"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {selected ? selected.label : ''}
            </button>
            <div className={'dropdown-menu' + (open ? ' show' : '')}>
                {options.map(option => (
                    <a
                        key={option.value}
                        href="#"
                        className={
                            'dropdown-item' + (option.value === value ? ' active' : '')
                        }
                        onClick={e => {
                            e.preventDefault();
                            onChange(option.value);
                            setOpen(false);
                        }}
                    >
                        {option.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelect;
