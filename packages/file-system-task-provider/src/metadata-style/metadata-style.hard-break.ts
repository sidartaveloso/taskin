import { HARD_BREAK } from '../inline-metadata.js';
import { defineMetadataStyle } from './metadata-style.base.js';
import type { MetadataStyle } from './metadata-style.types.js';

/**
 * The CommonMark hard break — a backslash ending every line **but the last**.
 *
 * The last line is the whole reason this module exists: a backslash there has
 * no following line to break, so CommonMark renders it as a literal `\` on
 * screen. Files written before this style knew about that end in
 * `Assignee: someone\`.
 *
 * @public
 */
export const hardBreakMetadataStyle: MetadataStyle = defineMetadataStyle({
  id: 'hard-break',

  // Uma linha com a barra basta: nenhum dos outros dois estilos a produz.
  matches: (blockLines) => blockLines.some((line) => line.trimEnd().endsWith(HARD_BREAK)),

  formatLines: (fields) =>
    fields.map((field, index) => {
      const isLast = index === fields.length - 1;
      return `${field.label}: ${field.value}${isLast ? '' : HARD_BREAK}`;
    }),
});
