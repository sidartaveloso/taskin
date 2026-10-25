import { promises as fs, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { corrigirPrioridadesTextuais, nivelDaPrioridade, planejarPrioridadesTextuais } from './prioridade-textual.js';

/**
 * `Priority: medium` e uma decisao escrita no formato errado.
 *
 * O parser descarta o valor e a tarefa aparece sem prioridade — mas quem
 * escreveu `high` numa e `low` noutra ja disse qual vem antes. O `--fix`
 * traduz essa decisao para o numero que o quadro entende; nao inventa uma.
 */
describe('nivelDaPrioridade', () => {
  it('ordena os niveis do mais urgente para o menos', () => {
    const niveis = ['critical', 'high', 'medium', 'low'].map(nivelDaPrioridade);

    expect(niveis).toEqual([...niveis].sort((a = 0, b = 0) => a - b));
    expect(new Set(niveis).size).toBe(4);
  });

  it('le portugues, com ou sem acento, e ignora caixa', () => {
    expect(nivelDaPrioridade('Alta')).toBe(nivelDaPrioridade('high'));
    expect(nivelDaPrioridade('média')).toBe(nivelDaPrioridade('medium'));
    expect(nivelDaPrioridade('media')).toBe(nivelDaPrioridade('medium'));
    expect(nivelDaPrioridade(' BAIXA ')).toBe(nivelDaPrioridade('low'));
  });

  it('nao adivinha palavra fora do vocabulario', () => {
    expect(nivelDaPrioridade('amanha')).toBeUndefined();
    expect(nivelDaPrioridade('120')).toBeUndefined();
  });
});

describe('planejarPrioridadesTextuais', () => {
  it('numera por nivel, e na ordem de chegada dentro do mesmo nivel', () => {
    const plano = planejarPrioridadesTextuais([
      { file: 'a.md', prioridade: 'medium' },
      { file: 'b.md', prioridade: 'high' },
      { file: 'c.md', prioridade: 'low' },
      { file: 'd.md', prioridade: 'medium' },
    ]);

    expect(plano).toEqual([
      { file: 'b.md', de: 'high', para: 100 },
      { file: 'a.md', de: 'medium', para: 200 },
      { file: 'd.md', de: 'medium', para: 300 },
      { file: 'c.md', de: 'low', para: 400 },
    ]);
  });

  /*
   * Hoje uma tarefa sem numero ja ordena depois de todas as numeradas. Entrar
   * depois do maior numero mantem exatamente essa posicao: o --fix nao move
   * ninguem em relacao a fila que alguem numerou.
   */
  it('entra depois da fila numerada, sem tocar em quem ja tem numero', () => {
    const plano = planejarPrioridadesTextuais([
      { file: 'a.md', prioridade: '700' },
      { file: 'b.md', prioridade: 'high' },
      { file: 'c.md', prioridade: '50' },
    ]);

    expect(plano).toEqual([{ file: 'b.md', de: 'high', para: 800 }]);
  });

  it('deixa como esta o que nao sabe ler, e quem nunca foi priorizado', () => {
    const plano = planejarPrioridadesTextuais([
      { file: 'a.md', prioridade: 'amanha' },
      { file: 'b.md', prioridade: undefined },
    ]);

    expect(plano).toEqual([]);
  });
});

describe('corrigirPrioridadesTextuais', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'taskin-prioridade-textual-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const io = {
    readFile: (alvo: string) => fs.readFile(alvo, 'utf-8'),
    writeFile: (alvo: string, conteudo: string) => fs.writeFile(alvo, conteudo, 'utf-8'),
  };

  it('reescreve a linha no lugar, no estilo que o arquivo ja usa', async () => {
    const arquivo = join(dir, 'task-001-a.md');
    writeFileSync(
      arquivo,
      ['# Task 001 — A', '', 'Status: done', 'Priority: medium', '', '## Description', 'x'].join('\n'),
    );

    const feitas = await corrigirPrioridadesTextuais([{ file: arquivo, prioridade: 'medium' }], io);

    expect(feitas).toEqual([{ file: arquivo, de: 'medium', para: 100 }]);
    expect(readFileSync(arquivo, 'utf-8')).toBe(
      ['# Task 001 — A', '', 'Status: done', 'Priority: 100', '', '## Description', 'x'].join('\n'),
    );
  });

  it('usa o rotulo em portugues quando o arquivo fala portugues', async () => {
    const arquivo = join(dir, 'task-001-a.md');
    writeFileSync(
      arquivo,
      ['# Tarefa 001 — A', '', '- Status: pending', '- Tipo: feat', '- Prioridade: alta', '', '## Descrição', 'x'].join(
        '\n',
      ),
    );

    await corrigirPrioridadesTextuais([{ file: arquivo, prioridade: 'alta' }], io);

    const conteudo = readFileSync(arquivo, 'utf-8');
    expect(conteudo).toContain('- Prioridade: 100');
    expect(conteudo).not.toMatch(/Priority/);
  });
});
