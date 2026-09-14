import styles from './inlinePrice.module.css';

/**
 * Ready-made `classes` prop for venia-ui's <Price> — keeps its
 * per-part spans inline everywhere, regardless of what CSS the
 * surrounding container happens to apply to bare spans (see
 * inlinePrice.module.css for why this is needed at all). Covers every
 * part type Intl.NumberFormat.formatToParts can produce for a currency
 * value.
 */
const inlinePriceClasses = {
    currency: styles.inline,
    integer: styles.inline,
    group: styles.inline,
    decimal: styles.inline,
    fraction: styles.inline,
    literal: styles.inline
};

export default inlinePriceClasses;
