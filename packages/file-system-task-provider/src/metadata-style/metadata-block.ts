import type { MetadataField } from './metadata-style.types.js';

/**
 * One metadata line, in any of the three styles.
 *
 * The leading `- ` and the trailing `\` are marking and are captured out; what
 * is left is the value. The label is bounded to keep a prose line that happens
 * to contain a colon from being read as metadata.
 *
 * The label must **start with a letter or a digit**. Without that, a header
 * line like `**Date**: 2026-01-08` or `> **Nota (registro historico):` parses
 * as a field and gets rewritten as one — both shapes exist in this repository.
 */
const METADATA_LINE = /^(?:-[ \t]+)?([\p{L}\p{N}][^:\n]{0,39}?)[ \t]*:[ \t]*(.*?)[ \t]*\\?[ \t]*$/u;

/** `## Description` and deeper — where the header ends. */
const SECTION_HEADING = /^#{2,}\s/;

/** The H1, which carries a `—` and sometimes a `:`, and is never metadata. */
const isHeading = (line: string): boolean => line.startsWith('#');

/**
 * The run of metadata lines of a task file, located and parsed.
 */
export interface MetadataBlock {
  /** The fields, in file order, with the marking removed. */
  readonly fields: readonly MetadataField[];
  /**
   * The raw metadata lines, as written — what a style's `matches` inspects.
   * Blank lines found inside the run are not here, but are inside
   * `start`..`end` and therefore disappear when the block is rewritten.
   */
  readonly lines: readonly string[];
  /** Index of the first block line in the split content. */
  readonly start: number;
  /** Index just past the last block line. */
  readonly end: number;
}

const splitLines = (content: string): string[] => content.split(/\r?\n/);

/**
 * Where the header ends: at the first `##`, or at the end of the file.
 *
 * Restricting to the header is what keeps a fenced example inside
 * `## Description` — this repository has task files full of them — from being
 * parsed as metadata.
 */
function headerEndIndex(lines: readonly string[]): number {
  const index = lines.findIndex((line) => SECTION_HEADING.test(line));
  return index === -1 ? lines.length : index;
}

/**
 * Locates and parses the metadata block, or returns `undefined` when the file
 * has none.
 *
 * The block is the first run of consecutive metadata lines in the header. It
 * has to be a run, and not every matching line in the header, so that prose
 * following the block is left alone.
 */
export function readMetadataBlock(content: string): MetadataBlock | undefined {
  const lines = splitLines(content);
  const headerEnd = headerEndIndex(lines);

  let start = -1;
  for (let index = 0; index < headerEnd; index++) {
    const line = lines[index] ?? '';
    if (isHeading(line) || line.trim() === '') continue;
    if (METADATA_LINE.test(line)) {
      start = index;
    }
    break;
  }

  if (start === -1) return undefined;

  /*
   * Uma linha em branco no meio nao encerra o bloco.
   *
   * O `taskin` ate a 4.0.0 inseria um campo novo logo apos o H1, antes da
   * linha em branco que separava do bloco real — um arquivo priorizado por
   * aquela versao fica com `Priority` sozinho la em cima e o resto embaixo.
   * Encerrando na primeira linha em branco, o bloco seria so o `Priority`: o
   * `Status` passava a ler `undefined` e reescreve-lo criava um segundo campo.
   *
   * `end` so avanca ate a ultima linha que e mesmo metadado, entao a linha em
   * branco final nao entra — mas as do meio entram no intervalo e somem quando
   * o bloco e reemitido, que e a reparacao desses arquivos.
   */
  let end = start;
  let cursor = start;
  while (cursor < headerEnd) {
    const line = lines[cursor] ?? '';
    if (isHeading(line)) break;
    if (line.trim() === '') {
      cursor++;
      continue;
    }
    if (!METADATA_LINE.test(line)) break;
    cursor++;
    end = cursor;
  }

  const fields: MetadataField[] = [];
  const blockLines: string[] = [];

  for (const line of lines.slice(start, end)) {
    const match = line.match(METADATA_LINE);
    if (!match?.[1]) continue;
    blockLines.push(line);
    fields.push({ label: match[1], value: match[2] ?? '' });
  }

  return { fields, lines: blockLines, start, end };
}

/**
 * Replaces the metadata block with `newLines`, or inserts one after the H1
 * when the file has none.
 *
 * Inserting after the H1 (and not at the top) is what the previous
 * `setInlineField` did, and it is the only position that keeps the title first.
 */
export function replaceMetadataBlock(content: string, newLines: readonly string[]): string {
  const lines = splitLines(content);
  const block = readMetadataBlock(content);

  if (block) {
    lines.splice(block.start, block.end - block.start, ...newLines);
    return lines.join('\n');
  }

  if (newLines.length === 0) return content;

  const titleIndex = lines.findIndex((line) => line.startsWith('# '));
  if (titleIndex === -1) {
    return [...newLines, '', ...lines].join('\n');
  }

  // Uma linha em branco de cada lado: sem ela o bloco vira continuacao do H1.
  lines.splice(titleIndex + 1, 0, '', ...newLines);
  return lines.join('\n');
}

/**
 * Removes the metadata block, and the blank line it left behind.
 */
export function removeMetadataBlock(content: string): string {
  const block = readMetadataBlock(content);
  if (!block) return content;

  const lines = splitLines(content);
  lines.splice(block.start, block.end - block.start);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Labels are compared case-insensitively, the way every reader already did. */
export const sameLabel = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();
