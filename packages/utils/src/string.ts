/**
 * String utilities
 */

/** Options for {@link slugify}. */
export interface SlugifyOptions {
  /**
   * Longest slug to return. Cuts at the last word boundary (hyphen) that fits,
   * never leaving a trailing hyphen; only when the first word alone is longer
   * does it cut mid-word. Counted after accents are removed.
   */
  maxLength?: number;
}

/**
 * Normalizes a string to create a URL-friendly slug
 * Removes accents and special characters
 *
 * @param text - The text to slugify
 * @param options - Optional limit on the slug length
 * @returns A URL-friendly slug
 *
 * @example
 * ```ts
 * slugify('Exclusão de propagação') // 'exclusao-de-propagacao'
 * slugify('Configuração Avançada') // 'configuracao-avancada'
 * slugify('Hello World!') // 'hello-world'
 * slugify('Levar uma task para o topo', { maxLength: 14 }) // 'levar-uma-task'
 * ```
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const slug = text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const { maxLength } = options;
  if (maxLength === undefined || slug.length <= maxLength) return slug;

  const cut = slug.slice(0, maxLength + 1);
  const boundary = cut.lastIndexOf('-');
  const trimmed = boundary > 0 ? cut.slice(0, boundary) : slug.slice(0, maxLength);
  return trimmed.replace(/-+$/, '');
}
