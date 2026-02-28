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
export declare function slugify(text: string): string;
