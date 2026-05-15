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
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeHtmlEntity(entity: string): string {
  // Entidades nomeadas do mapa
  if (ENTITIES[entity]) return ENTITIES[entity];

  // Entidades numéricas decimais: &#123;
  const decMatch = entity.match(/^&#(\d+);$/);
  if (decMatch) {
    const code = parseInt(decMatch[1], 10);
    if (!isNaN(code) && code > 0) {
      try {
        return String.fromCodePoint(code);
      } catch {
        return ' ';
      }
    }
  }

  // Entidades numéricas hexadecimais: &#x7B;
  const hexMatch = entity.match(/^&#x([0-9a-f]+);$/i);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    if (!isNaN(code) && code > 0) {
      try {
        return String.fromCodePoint(code);
      } catch {
        return ' ';
      }
    }
  }

  return ' ';
}

export function stripHtml(input?: string | null, maxLength?: number): string {
  if (!input) return '';
  const noTags = input.replace(/<[^>]*>/g, ' ');
  const decoded = noTags.replace(/&[a-zA-Z0-9#]+;/g, (m) => decodeHtmlEntity(m));
  const collapsed = decoded.replace(/\s+/g, ' ').trim();
  if (maxLength && collapsed.length > maxLength) {
    return collapsed.slice(0, maxLength).trimEnd() + '…';
  }
  return collapsed;
}

export default stripHtml;