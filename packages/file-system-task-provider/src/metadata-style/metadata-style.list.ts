import { defineMetadataStyle } from './metadata-style.base.js';
import type { MetadataStyle } from './metadata-style.types.js';

/** `- ` — the only marking that reads well raw *and* renders as its own line. */
const LIST_MARKER = '- ';

/**
 * The default style: a markdown bullet list.
 *
 * @public
 */
export const listMetadataStyle: MetadataStyle = defineMetadataStyle({
  id: 'list',

  // Um bloco so esta neste estilo se **todas** as linhas forem itens: uma so
  // com `- ` no meio de linhas soltas e um arquivo misto, nao um bloco `list`.
  matches: (blockLines) =>
    blockLines.length > 0 && blockLines.every((line) => line.trimStart().startsWith(LIST_MARKER)),

  formatLines: (fields) => fields.map((field) => `${LIST_MARKER}${field.label}: ${field.value}`),
});
