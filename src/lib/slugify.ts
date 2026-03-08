/**
 * Custom slugify utility — replaces the `slugify` npm package
 * to avoid TS1540 errors from its outdated type declarations.
 */

const charMap: Record<string, string> = {
  // Latin
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
  'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
  'Ð': 'D', 'Ñ': 'N',
  'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss',
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
  'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ð': 'd', 'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o',
  'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'þ': 'th', 'ÿ': 'y',
  // Special
  '&': 'e', '@': 'a',
};

interface SlugifyOptions {
  lower?: boolean;
  strict?: boolean;
  replacement?: string;
  trim?: boolean;
}

export default function slugify(
  str: string,
  options: SlugifyOptions = {}
): string {
  const { lower = false, strict = false, replacement = '-', trim: doTrim = true } = options;

  // Transliterate known characters
  let result = str
    .split('')
    .map((ch) => charMap[ch] || ch)
    .join('');

  // Normalize unicode (decompose + remove combining marks)
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (lower) {
    result = result.toLowerCase();
  }

  if (strict) {
    // Remove everything except alphanumerics, spaces, and hyphens
    result = result.replace(/[^a-zA-Z0-9\s-]/g, '');
  }

  // Replace whitespace and repeated hyphens with the replacement character
  result = result.replace(/[\s]+/g, replacement);
  result = result.replace(new RegExp(`[${replacement}]+`, 'g'), replacement);

  if (doTrim) {
    // Remove leading/trailing replacement characters
    result = result.replace(new RegExp(`^${replacement}+|${replacement}+$`, 'g'), '');
  }

  return result;
}
