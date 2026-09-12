/**
 * Magento's Admin CMS block editor defaults to the Page Builder stage.
 * If raw HTML (like our mega-menu/footer block content) gets opened and
 * re-saved there instead of through "Edit HTML Code" source view, two
 * things happen to it on save:
 *
 *   1. It gets wrapped: <div data-content-type="html" ...>...</div>
 *   2. The real markup inside gets HTML-escaped as plain text, e.g.
 *      <li class="..."> becomes the literal text "&lt;li class=...&gt;"
 *
 * Rather than rely on every admin edit going through the source view
 * correctly forever, this makes CMS block content resilient to both,
 * so `dangerouslySetInnerHTML` always gets real, working markup —
 * whichever way the block was last saved.
 *
 * @param {string} html - raw `content` field from a `cmsBlocks` query
 * @returns {string} usable HTML, safe to pass to dangerouslySetInnerHTML
 */
export function normalizeCmsHtml(html) {
    if (!html) return '';

    // No DOM (e.g. SSR) — nothing we can safely unwrap/decode; return as-is.
    if (typeof document === 'undefined') {
        return html;
    }

    let content = html;

    const scratch = document.createElement('div');
    scratch.innerHTML = content;
    const wrapper = scratch.querySelector(':scope > [data-content-type="html"]');

    if (wrapper) {
        const looksEscaped =
            wrapper.children.length === 0 && /<[a-z]/i.test(wrapper.textContent);
        // `.textContent` on a wrapper whose content is one escaped text
        // node returns it already decoded (real "<", not "&lt;") — the
        // browser's own entity decoder, no regex needed. If the wrapper
        // instead holds real parsed elements, use its innerHTML as-is.
        content = looksEscaped ? wrapper.textContent : wrapper.innerHTML;
    } else if (/&lt;\s*\/?\s*[a-z]/i.test(content)) {
        // Escaped without a wrapper div — decode the same way.
        const decoder = document.createElement('div');
        decoder.innerHTML = content;
        content = decoder.textContent;
    }

    return content;
}
