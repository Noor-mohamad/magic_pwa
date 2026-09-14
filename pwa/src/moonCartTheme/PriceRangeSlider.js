import React, { useEffect, useRef, useState } from 'react';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

/**
 * Theme's dual-handle price filter (shop-standard.html's
 * "#slider-tooltips" widget, powered by nouislider — see
 * scss/components/_nouislider.scss for the ".range-slider.style-1"
 * skin, already in the ported style.css). The theme's own JS wires
 * this with a hardcoded demo range (0-400); here `min`/`max` come from
 * the real price aggregation buckets (see categoryContent.js), and the
 * currency symbol is derived from real product price data already on
 * the page rather than assumed.
 */
const PriceRangeSlider = ({ min, max, valueMin, valueMax, currencyCode, locale, onChangeCommitted }) => {
    const sliderElRef = useRef(null);
    const sliderInstanceRef = useRef(null);
    const [displayMin, setDisplayMin] = useState(valueMin);
    const [displayMax, setDisplayMax] = useState(valueMax);

    const formatMoney = value => {
        try {
            return new Intl.NumberFormat(locale || 'en-US', {
                style: 'currency',
                currency: currencyCode || 'USD',
                maximumFractionDigits: 0
            }).format(value);
        } catch (e) {
            return `${value}`;
        }
    };

    useEffect(() => {
        if (!sliderElRef.current || min == null || max == null || min >= max) {
            return undefined;
        }

        const el = sliderElRef.current;
        const start = [
            valueMin != null ? valueMin : min,
            valueMax != null ? valueMax : max
        ];

        noUiSlider.create(el, {
            start,
            connect: true,
            step: 1,
            range: { min, max },
            format: {
                from: value => Number(value),
                to: value => Math.round(value)
            }
        });
        sliderInstanceRef.current = el.noUiSlider;

        el.noUiSlider.on('update', values => {
            setDisplayMin(values[0]);
            setDisplayMax(values[1]);
        });
        el.noUiSlider.on('change', values => {
            onChangeCommitted(values[0], values[1]);
        });

        return () => {
            if (el.noUiSlider) {
                el.noUiSlider.destroy();
            }
            sliderInstanceRef.current = null;
        };
        // Deliberately re-create only when the real bounds change — not
        // on every valueMin/valueMax change, which would fight the
        // user's own in-progress drag with noUiSlider's own `.set()`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [min, max]);

    if (min == null || max == null || min >= max) {
        return null;
    }

    return (
        <div className="price-slide range-slider">
            <div className="price">
                <div className="range-slider style-1">
                    <div ref={sliderElRef} className="mb-3" />
                    <span className="example-val">Min Price: {formatMoney(displayMin)}</span>
                    <span className="example-val">Max Price: {formatMoney(displayMax)}</span>
                </div>
            </div>
        </div>
    );
};

export default PriceRangeSlider;
