import type { Task } from '@opentask/taskin-types';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import {
  PRIORIDADE_MAXIMA,
  posicionarNoExtremo,
  posicionarPrioridade,
  validarPrioridade,
} from './posicionar-prioridade.js';

const tarefa = (id: string, order?: number): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', order }) as Task;

const ids = (ts: readonly Task[]) => ts.map((t) => String(t.id));
const ordemDe = (ts: readonly Task[], id: string) => ts.find((t) => String(t.id) === id)?.order;

/**
 * Prioridade relativa: "isto antes daquilo", sem obrigar a olhar a lista.
 *
 * Reaproveita a numeracao por passos da task-084, e herda a garantia dela: so
 * volta o que muda, e o que muda fica na vizinhanca.
 */
describe('posicionarPrioridade', () => {
  it('antes de um vizinho, cai no meio do espaco e muda um arquivo so', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003', 300)];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('003'), parseTaskId('002'), 'before');

    expect(ids(mudancas)).toEqual(['003']);
    expect(ordemDe(mudancas, '003')).toBeGreaterThan(100);
    expect(ordemDe(mudancas, '003')).toBeLessThan(200);
  });

  it('depois do ultimo, ganha um passo a frente', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003', 300)];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('001'), parseTaskId('003'), 'after');

    expect(ids(mudancas)).toEqual(['001']);
    expect(ordemDe(mudancas, '001')).toBeGreaterThan(300);
  });

  it('antes do primeiro, fica a frente dele', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200)];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('002'), parseTaskId('001'), 'before');

    expect(ids(mudancas)).toEqual(['002']);
    expect(ordemDe(mudancas, '002')).toBeLessThan(100);
  });

  it('sem espaco entre os vizinhos, renumera so a vizinhanca', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 101), tarefa('003', 500), tarefa('004', 900)];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('004'), parseTaskId('002'), 'before');

    expect(ids(mudancas)).not.toContain('003');
    const nova = ordemDe(mudancas, '004') ?? 0;
    expect(nova).toBeGreaterThan(100);
    expect(nova).toBeLessThan(ordemDe(mudancas, '002') ?? 0);
    expect(ordemDe(mudancas, '002')).toBeLessThan(500);
  });

  /*
   * O caso do projeto meio numerado: as tarefas sem numero depois do ponto de
   * insercao nao sao tocadas — elas ja ordenam por ultimo.
   */
  it('nao numera quem esta sem numero depois do ponto de insercao', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003'), tarefa('004')];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('004'), parseTaskId('001'), 'after');

    expect(ids(mudancas)).toEqual(['004']);
  });

  it('depois de uma tarefa sem numero, numera ate ela e nao alem', () => {
    const tarefas = [tarefa('001', 100), tarefa('002'), tarefa('003'), tarefa('004')];

    const mudancas = posicionarPrioridade(tarefas, parseTaskId('001'), parseTaskId('002'), 'after');

    expect(ids(mudancas).sort()).toEqual(['001', '002']);
    expect(ordemDe(mudancas, '002')).toBeLessThan(ordemDe(mudancas, '001') ?? 0);
  });

  it('recusa posicionar uma tarefa em relacao a ela mesma', () => {
    expect(() => posicionarPrioridade([tarefa('001', 100)], parseTaskId('001'), parseTaskId('001'), 'before')).toThrow(
      /itself/,
    );
  });

  it('recusa uma referencia que nao existe', () => {
    expect(() => posicionarPrioridade([tarefa('001', 100)], parseTaskId('001'), parseTaskId('999'), 'before')).toThrow(
      /999/,
    );
  });
});

/**
 * Topo e fim: o atalho da task-114, com a semantica dos botoes do dashboard
 * (task-101). Uma tarefa agrupada vai ao extremo do **proprio grupo**.
 */
describe('posicionarNoExtremo', () => {
  const g1 = parseGroupId('g-1');
  const noGrupo = (id: string, order?: number): Task => ({ ...tarefa(id, order), groupId: g1 }) as Task;

  it('topo fica a frente da primeira da fila e grava um arquivo so', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003', 300)];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('003'), 'top');

    expect(ids(mudancas)).toEqual(['003']);
    expect(ordemDe(mudancas, '003')).toBeLessThan(100);
  });

  it('fim fica depois da ultima numerada e grava um arquivo so', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003', 300)];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('001'), 'bottom');

    expect(ids(mudancas)).toEqual(['001']);
    expect(ordemDe(mudancas, '001')).toBeGreaterThan(300);
  });

  /*
   * O custo medido nas notas da task: com 1 e 2 numeradas e 3 e 4 sem, levar a
   * 1 ao fim numera a cauda — 3 arquivos. Depois disso, o proximo custa 1.
   */
  it('fim de uma cauda sem numero numera a cauda: 3 arquivos, e depois 1', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003'), tarefa('004')];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('001'), 'bottom');

    expect(ids(mudancas).sort()).toEqual(['001', '003', '004']);
    expect(ordemDe(mudancas, '001')).toBeGreaterThan(ordemDe(mudancas, '004') ?? Number.POSITIVE_INFINITY);

    const depois = tarefas.map((t) => mudancas.find((m) => m.id === t.id) ?? t);
    expect(ids(posicionarNoExtremo(depois, parseTaskId('002'), 'bottom'))).toEqual(['002']);
  });

  it('quem ja esta no extremo nao grava nada', () => {
    const tarefas = [tarefa('001', 100), tarefa('002', 200), tarefa('003')];

    expect(posicionarNoExtremo(tarefas, parseTaskId('001'), 'top')).toEqual([]);
    expect(posicionarNoExtremo(tarefas, parseTaskId('003'), 'bottom')).toEqual([]);
  });

  it('tarefa sozinha na fila nao grava nada', () => {
    expect(posicionarNoExtremo([tarefa('001')], parseTaskId('001'), 'top')).toEqual([]);
  });

  it('agrupada vai ao topo do proprio grupo, e nao da fila inteira', () => {
    const tarefas = [tarefa('001', 100), noGrupo('002', 200), tarefa('003', 300), noGrupo('004', 400)];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('004'), 'top');

    expect(ids(mudancas)).toEqual(['004']);
    expect(ordemDe(mudancas, '004')).toBeGreaterThan(100);
    expect(ordemDe(mudancas, '004')).toBeLessThan(200);
  });

  it('agrupada vai ao fim do proprio grupo, e nao da fila inteira', () => {
    const tarefas = [noGrupo('001', 100), noGrupo('002', 200), tarefa('003', 300)];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('001'), 'bottom');

    expect(ids(mudancas)).toEqual(['001']);
    expect(ordemDe(mudancas, '001')).toBeGreaterThan(200);
    expect(ordemDe(mudancas, '001')).toBeLessThan(300);
  });

  it('solta vai a frente de um grupo que abre a fila, e para depois de um que a fecha', () => {
    const tarefas = [noGrupo('001', 100), tarefa('002', 200), noGrupo('003', 300)];

    const topo = posicionarNoExtremo(tarefas, parseTaskId('002'), 'top');
    expect(ordemDe(topo, '002')).toBeLessThan(100);

    const fim = posicionarNoExtremo(tarefas, parseTaskId('002'), 'bottom');
    expect(ordemDe(fim, '002')).toBeGreaterThan(300);
  });

  it('sozinha no grupo ja esta nos dois extremos dele', () => {
    const tarefas = [tarefa('001', 100), noGrupo('002', 200), tarefa('003', 300)];

    expect(posicionarNoExtremo(tarefas, parseTaskId('002'), 'top')).toEqual([]);
    expect(posicionarNoExtremo(tarefas, parseTaskId('002'), 'bottom')).toEqual([]);
  });

  it('recusa uma tarefa que nao existe', () => {
    expect(() => posicionarNoExtremo([tarefa('001', 100)], parseTaskId('999'), 'top')).toThrow(/999/);
  });
});

describe('validarPrioridade', () => {
  it.each([1, 100, PRIORIDADE_MAXIMA])('aceita %s', (n) => {
    expect(validarPrioridade(n)).toBe(n);
  });

  it.each([0, -5, 2.5, Number.NaN, PRIORIDADE_MAXIMA + 1])('recusa %s, dizendo a faixa', (n) => {
    expect(() => validarPrioridade(n)).toThrow(/whole number from 1/);
  });
});
