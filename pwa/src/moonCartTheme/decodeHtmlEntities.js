const ENTITY_MAP = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    reg: '®',
    trade: '™',
    copy: '©',
    deg: '°',
    frac14: '¼',
    frac12: '½',
    frac34: '¾',
    nbsp: ' '
};

/**
 * Some of this catalog's real attribute option labels (Magento's own
 * sample-data import) contain HTML entities with the wrong
 * capitalization — e.g. "Cocona&Reg; Performance Fabric" and
 * "&Frac14; Zip" instead of "&reg;"/"&frac14;". Named HTML character
 * references are case-sensitive, so browsers never decode "&Reg;",
 * "&Trade;" or "&Frac14;" — they render as that literal text. This
 * decodes the finite, known set of entities that actually show up in
 * this data, case-insensitively, rather than a general (and riskier)
 * case-insensitive HTML decode that could mangle a genuinely
 * case-sensitive entity elsewhere.
 */
export function decodeHtmlEntities(str) {
    if (!str) return str;
    return str.replace(/&([A-Za-z0-9]+);/g, (match, name) => {
        const value = ENTITY_MAP[name.toLowerCase()];
        return value != null ? value : match;
    });
}

export default decodeHtmlEntities;
