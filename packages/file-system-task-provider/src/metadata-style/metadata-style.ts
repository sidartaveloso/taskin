import { readMetadataBlock, replaceMetadataBlock, sameLabel } from './metadata-block.js';
import { hardBreakMetadataStyle } from './metadata-style.hard-break.js';
import { listMetadataStyle } from './metadata-style.list.js';
import { plainMetadataStyle } from './metadata-style.plain.js';
import type { MetadataStyle, MetadataStyleId } from './metadata-style.types.js';

/**
 * The style used for files this provider creates.
 *
 * `list` because it is the only one of the three that is clean in the raw file
 * and still renders as separate lines.
 *
 * @public
 */
export const DEFAULT_METADATA_STYLE_ID: MetadataStyleId = 'list';

/**
 * Detection order, and it matters.
 *
 * `hard-break` first because its marking is unambiguous, `list` next, `plain`
 * last because it matches anything — it is the fallback, not a test.
 */
const DETECTION_ORDER: readonly MetadataStyle[] = [hardBreakMetadataStyle, listMetadataStyle, plainMetadataStyle];

/**
 * Every style, by id.
 *
 * @public
 */
export const METADATA_STYLES: Readonly<Record<MetadataStyleId, MetadataStyle>> = {
  'hard-break': hardBreakMetadataStyle,
  list: listMetadataStyle,
  plain: plainMetadataStyle,
};

/**
 * All valid ids, for validating a flag or a config value.
 *
 * @public
 */
export const METADATA_STYLE_IDS: readonly MetadataStyleId[] = ['list', 'hard-break', 'plain'];

/**
 * @public
 */
export function isMetadataStyleId(value: unknown): value is MetadataStyleId {
  return typeof value === 'string' && (METADATA_STYLE_IDS as readonly string[]).includes(value);
}

/**
 * @public
 */
export function getMetadataStyle(id: MetadataStyleId): MetadataStyle {
  return METADATA_STYLES[id];
}

/**
 * The style a file is already written in, or `undefined` when it has no
 * metadata block to judge by.
 *
 * @public
 */
export function detectMetadataStyle(content: string): MetadataStyle | undefined {
  const block = readMetadataBlock(content);
  if (!block || block.lines.length === 0) return undefined;
  return DETECTION_ORDER.find((style) => style.matches(block.lines));
}

/**
 * The style to write a given file in: the one it already uses, falling back to
 * `fallback` for a file that has no block yet.
 *
 * This is the rule that keeps files from going mixed. An edit follows the
 * file; only creation follows the configuration.
 *
 * @public
 */
export function resolveMetadataStyle(
  content: string,
  fallback: MetadataStyleId = DEFAULT_METADATA_STYLE_ID,
): MetadataStyle {
  return detectMetadataStyle(content) ?? getMetadataStyle(fallback);
}

/**
 * Reads a field by any of the given labels, whatever style the file uses.
 *
 * Takes several labels because the same field is `Assignee` in an English file
 * and `Responsável` in a Portuguese one, and both have to read.
 *
 * @public
 */
export function readMetadataField(content: string, ...labels: readonly string[]): string | undefined {
  const block = readMetadataBlock(content);
  if (!block) return undefined;

  for (const label of labels) {
    const field = block.fields.find((candidate) => sameLabel(candidate.label, label));
    if (field) return field.value;
  }

  return undefined;
}

/**
 * Upserts a field, preserving the style the file is already written in.
 *
 * @public
 */
export function writeMetadataField(
  content: string,
  label: string,
  value: string | undefined,
  fallback: MetadataStyleId = DEFAULT_METADATA_STYLE_ID,
): string {
  return resolveMetadataStyle(content, fallback).write(content, label, value);
}

/**
 * Rewrites the metadata block in `target`, leaving the rest of the file alone.
 *
 * @public
 */
export function convertMetadataStyle(content: string, target: MetadataStyleId): string {
  const block = readMetadataBlock(content);
  if (!block || block.fields.length === 0) return content;

  const lines = getMetadataStyle(target).format(block.fields).split('\n');

  /*
   * Comparar so as linhas de metadado nao basta: o bloco pode estar com a
   * marcacao certa e ainda assim partido por uma linha em branco no meio, e ai
   * `block.lines` (que nao inclui as brancas) bate com o formatado e o arquivo
   * ficava como estava. `end - start` conta o intervalo inteiro, brancas
   * incluidas, entao um bloco partido sempre e reemitido.
   */
  const intacto = lines.join('\n') === block.lines.join('\n');
  const contiguo = block.end - block.start === block.lines.length;
  if (intacto && contiguo) return content;

  return replaceMetadataBlock(content, lines);
}
