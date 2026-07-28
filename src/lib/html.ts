/**
 * Minimal HTML → readable text for `product.longDescription`.
 *
 * The CMS returns light HTML (paragraphs, `<ul><li>`, bold, links). Rather than
 * pull in a full rich-text renderer for the first pass, we flatten it to text
 * blocks: list items become "• …" lines, block elements become line breaks,
 * remaining tags are stripped and a few common entities decoded.
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

export function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*\/\s*(p|div|ul|ol|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#?\w+;/g, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
