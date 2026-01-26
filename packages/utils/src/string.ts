/**
 * String utilities
 */

/**
 * Normalizes a string to create a URL-friendly slug
 * Removes accents and special characters
 *
 * @param text - The text to slugify
 * @returns A URL-friendly slug
 *
 * @example
 * ```ts
 * slugify('Exclusão de propagação') // 'exclusao-de-propagacao'
 * slugify('Configuração Avançada') // 'configuracao-avancada'
 * slugify('Hello World!') // 'hello-world'
 * ```
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
