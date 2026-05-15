/**
 * Remove tags HTML e decodifica todas as entidades HTML para uso seguro
 * em previews de texto (cards, listas, og:description).
 *
 * Usa o DOM do browser para decodificacao completa de entidades.
 */
export function stripHtml(input?: string | null, maxLength?: number): string {
  if (!input) return '';

  // Remove tags HTML
  const noTags = input.replace(/<[^>]*>/g, ' ');

  // Decodifica entidades HTML usando o DOM (browser) ou fallback
  let decoded: string;
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = noTags;
    decoded = textarea.value;
  } else {
    decoded = noTags;
  }

  const collapsed = decoded.replace(/\s+/g, ' ').trim();
  if (maxLength && collapsed.length > maxLength) {
    return collapsed.slice(0, maxLength).trimEnd() + '…';
  }
  return collapsed;
}

export default stripHtml;