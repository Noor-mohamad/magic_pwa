/**
 * Real hex values for the store's "color" attribute (attribute_id 93),
 * keyed by EAV option id — which is exactly what
 * `products.aggregations` returns as each color option's `value` (see
 * categoryContent.js), confirmed by comparing the two live:
 *   aggregations: { label: "Black", value: "49" }
 *   eav_attribute_option_swatch: option_id 49 -> "#000000"
 *
 * Why this is a snapshot instead of a live query: Magento's GraphQL
 * schema *does* expose real swatch hex data (SwatchLayerFilterItem.
 * swatch_data), but only through the deprecated `products.filters`
 * field — `aggregations` (the non-deprecated, actually-used field)
 * has no swatch_data of its own. `products.filters` returned an empty
 * array on this store when tested live, so it isn't a usable path
 * here. There's no other GraphQL field that carries swatch hex for
 * layered navigation.
 *
 * This map was read directly from `eav_attribute_option_swatch` (real
 * admin-configured swatch data, not invented), rather than fabricated.
 * It only needs updating if you add/remove color options in Admin —
 * ask and I can regenerate it any time via the same DB read.
 */
const colorSwatchHex = {
    49: '#000000', // Black
    50: '#1857f7', // Blue
    51: '#945454', // Brown
    52: '#8f8f8f', // Gray
    53: '#53a828', // Green
    54: '#ce64d4', // Lavender
    55: '#ffffff', // Multi
    56: '#eb6703', // Orange
    57: '#ef3dff', // Purple
    58: '#ff0000', // Red
    59: '#ffffff', // White
    60: '#ffd500' // Yellow
};

export default colorSwatchHex;
