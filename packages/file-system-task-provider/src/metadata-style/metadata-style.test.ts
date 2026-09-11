import { describe, expect, it } from 'vitest';
import { BLOCK_FIXTURES, runMetadataStyleContractTests } from './metadata-style.contract.js';
import { hardBreakMetadataStyle } from './metadata-style.hard-break.js';
import {
  convertMetadataStyle,
  DEFAULT_METADATA_STYLE_ID,
  detectMetadataStyle,
  isMetadataStyleId,
  readMetadataField,
  resolveMetadataStyle,
  writeMetadataField,
} from './metadata-style.js';
import { listMetadataStyle } from './metadata-style.list.js';
import { plainMetadataStyle } from './metadata-style.plain.js';

runMetadataStyleContractTests(listMetadataStyle);
runMetadataStyleContractTests(hardBreakMetadataStyle);
runMetadataStyleContractTests(plainMetadataStyle);

const TITLE = '# 🧩 Task 001 — A title';

const fileWith = (block: string): string => `${TITLE}

${block}

## Description
Body.
`;

describe('detectMetadataStyle', () => {
  it.each([
    ['list', BLOCK_FIXTURES.list],
    ['hard-break', BLOCK_FIXTURES['hard-break']],
    ['hard-break', BLOCK_FIXTURES['hard-break-legacy']],
    ['plain', BLOCK_FIXTURES.plain],
  ])('reads a %s block as %s', (expected, block) => {
    expect(detectMetadataStyle(fileWith(block))?.id).toBe(expected);
  });

  it('returns undefined when there is no block', () => {
    expect(detectMetadataStyle(`${TITLE}\n\n## Description\nBody.\n`)).toBeUndefined();
  });

  it('does not call a half-marked block a list', () => {
    expect(detectMetadataStyle(fileWith('- Status: pending\nType: feat'))?.id).toBe('plain');
  });
});

describe('resolveMetadataStyle', () => {
  it('follows the file over the configured default', () => {
    expect(resolveMetadataStyle(fileWith(BLOCK_FIXTURES['hard-break']), 'list').id).toBe('hard-break');
  });

  it('falls back to the configured default for a file with no block', () => {
    expect(resolveMetadataStyle(`${TITLE}\n\n## Description\n`, 'plain').id).toBe('plain');
  });

  it('defaults to list', () => {
    expect(DEFAULT_METADATA_STYLE_ID).toBe('list');
    expect(resolveMetadataStyle(`${TITLE}\n`).id).toBe('list');
  });
});

describe('readMetadataField', () => {
  it.each(Object.entries(BLOCK_FIXTURES))('reads through a %s block', (_id, block) => {
    expect(readMetadataField(fileWith(block), 'Assignee')).toBe('sidarta-veloso');
  });

  it('tries each label in turn, localized first', () => {
    const content = fileWith('- Responsável: sidarta-veloso');
    expect(readMetadataField(content, 'Responsável', 'Assignee')).toBe('sidarta-veloso');
  });

  it('returns undefined when no label matches', () => {
    expect(readMetadataField(fileWith(BLOCK_FIXTURES.list), 'Nope')).toBeUndefined();
  });
});

describe('writeMetadataField', () => {
  it('keeps a hard-break file in hard-break, minus the dangling break', () => {
    const updated = writeMetadataField(fileWith(BLOCK_FIXTURES['hard-break-legacy']), 'Status', 'done');
    expect(updated).toContain('Status: done\\\n');
    expect(updated).toContain('Assignee: sidarta-veloso\n');
    expect(updated).not.toContain('sidarta-veloso\\');
  });

  it('never leaves a file half in one style', () => {
    const updated = writeMetadataField(fileWith('- Status: pending\nType: feat\\\n- Assignee: ana'), 'Status', 'done');
    const block = updated.split('\n').filter((line) => /(?:Status|Type|Assignee):/.test(line));
    expect(new Set(block.map((line) => line.startsWith('- ')))).toEqual(new Set([false]));
  });
});

describe('convertMetadataStyle', () => {
  it.each(Object.entries(BLOCK_FIXTURES))('converts a %s block to list', (_id, block) => {
    const converted = convertMetadataStyle(fileWith(block), 'list');
    expect(converted).toContain('- Status: pending\n- Type: feat\n- Assignee: sidarta-veloso');
    expect(converted).toContain('## Description\nBody.');
  });

  it('drops the dangling break when converting the legacy block to hard-break', () => {
    const converted = convertMetadataStyle(fileWith(BLOCK_FIXTURES['hard-break-legacy']), 'hard-break');
    expect(converted).toContain('Status: pending\\\nType: feat\\\nAssignee: sidarta-veloso\n');
  });

  it('is idempotent', () => {
    const once = convertMetadataStyle(fileWith(BLOCK_FIXTURES['hard-break']), 'list');
    expect(convertMetadataStyle(once, 'list')).toBe(once);
  });

  it('round-trips through every style without losing a value', () => {
    let content = fileWith(BLOCK_FIXTURES['hard-break-legacy']);
    for (const target of ['list', 'plain', 'hard-break', 'list'] as const) {
      content = convertMetadataStyle(content, target);
      expect(readMetadataField(content, 'Assignee')).toBe('sidarta-veloso');
      expect(readMetadataField(content, 'Status')).toBe('pending');
    }
  });

  it('leaves a file with no block alone', () => {
    const content = `${TITLE}\n\n## Description\n`;
    expect(convertMetadataStyle(content, 'list')).toBe(content);
  });
});

describe('bloco partido por linha em branco (arquivo gravado ate a 4.0.0)', () => {
  /*
   * O `setInlineField` daquela versao inseria um campo novo logo apos o H1,
   * antes da linha em branco que separava do bloco real. Um arquivo priorizado
   * por ela fica assim.
   */
  const legado = `${TITLE}
Priority: 10\\

Status: pending\\
Type: feat\\
Assignee: sidarta-veloso\\

## Description
x
`;

  it('le todos os campos, e nao so os do primeiro pedaco', () => {
    expect(readMetadataField(legado, 'Priority')).toBe('10');
    expect(readMetadataField(legado, 'Status')).toBe('pending');
    expect(readMetadataField(legado, 'Type')).toBe('feat');
    expect(readMetadataField(legado, 'Assignee')).toBe('sidarta-veloso');
  });

  it('junta tudo num bloco so ao escrever, sem duplicar o campo', () => {
    const atualizado = writeMetadataField(legado, 'Status', 'done');
    expect(atualizado.match(/^Status:/gm)).toHaveLength(1);
    expect(readMetadataField(atualizado, 'Status')).toBe('done');
    expect(readMetadataField(atualizado, 'Priority')).toBe('10');
    expect(atualizado).not.toMatch(/Priority: 10\\?\n\n/);
  });

  it('preserva o estilo do arquivo na reparacao', () => {
    expect(detectMetadataStyle(legado)?.id).toBe('hard-break');
    const atualizado = writeMetadataField(legado, 'Status', 'done');
    expect(atualizado).toMatch(/^Assignee: sidarta-veloso$/m);
  });
});

describe('linhas do cabecalho que nao sao metadado', () => {
  it('nao trata rotulo em negrito como campo', () => {
    const content = `${TITLE}

- Status: pending

**Date**: 2026-01-08

## Description
x
`;
    expect(readMetadataField(content, '**Date**')).toBeUndefined();
    expect(readMetadataField(content, 'Date')).toBeUndefined();
    const atualizado = writeMetadataField(content, 'Status', 'done');
    expect(atualizado).toContain('**Date**: 2026-01-08');
    expect(atualizado).not.toContain('- **Date**');
  });

  it('nao absorve uma citacao que vem depois do bloco', () => {
    const content = `${TITLE}

- Status: pending
- Type: feat

> **Nota (registro historico):** algo

## Description
x
`;
    const atualizado = writeMetadataField(content, 'Status', 'done');
    expect(atualizado).toContain('> **Nota (registro historico):** algo');
    expect(atualizado).not.toMatch(/^- > /m);
  });
});

describe('isMetadataStyleId', () => {
  it.each(['list', 'hard-break', 'plain'])('accepts %s', (id) => {
    expect(isMetadataStyleId(id)).toBe(true);
  });

  it.each(['yaml', '', undefined, 3])('rejects %s', (value) => {
    expect(isMetadataStyleId(value)).toBe(false);
  });
});
