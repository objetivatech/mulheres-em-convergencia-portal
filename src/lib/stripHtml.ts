/**
 * Remove tags HTML e decodifica entidades comuns para uso seguro
 * em previews de texto (cards, listas, og:description).
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function stripHtml(input?: string | null, maxLength?: number): string {
  if (!input) return '';
  const noTags = input.replace(/<[^>]*>/g, ' ');
  const decoded = noTags.replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? ' ');
  const collapsed = decoded.replace(/\s+/g, ' ').trim();
  if (maxLength && collapsed.length > maxLength) {
    return collapsed.slice(0, maxLength).trimEnd() + '…';
  }
  return collapsed;
}

export default stripHtml;