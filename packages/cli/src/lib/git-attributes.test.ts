import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureRunsMergeAttribute, RUNS_MERGE_ATTRIBUTE } from './git-attributes.js';

const pasta = () => mkdtempSync(join(tmpdir(), 'taskin-attributes-'));

describe('ensureRunsMergeAttribute', () => {
  it('cria o arquivo com o atributo', () => {
    const dir = pasta();
    expect(ensureRunsMergeAttribute(dir)).toBe(true);
    expect(readFileSync(join(dir, '.gitattributes'), 'utf8')).toBe(`${RUNS_MERGE_ATTRIBUTE}\n`);
  });

  it('acrescenta sem apagar o que ja ha, mesmo sem quebra de linha no fim', () => {
    const dir = pasta();
    writeFileSync(join(dir, '.gitattributes'), '*.png binary');
    expect(ensureRunsMergeAttribute(dir)).toBe(true);
    expect(readFileSync(join(dir, '.gitattributes'), 'utf8')).toBe(`*.png binary\n${RUNS_MERGE_ATTRIBUTE}\n`);
  });

  it('nao repete o atributo', () => {
    const dir = pasta();
    ensureRunsMergeAttribute(dir);
    expect(ensureRunsMergeAttribute(dir)).toBe(false);
    expect(readFileSync(join(dir, '.gitattributes'), 'utf8')).toBe(`${RUNS_MERGE_ATTRIBUTE}\n`);
  });
});
