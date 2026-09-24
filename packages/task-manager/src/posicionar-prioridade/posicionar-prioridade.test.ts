import type { Task } from '@opentask/taskin-types';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import {
  PRIORIDADE_MAXIMA,
  posicionarGrupo,
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

/**
 * Mover um grupo inteiro (task-117): o bloco de membros vai junto, e so ele e
 * gravado — a mesma conta do dashboard, medida na task-101 (grupo de 3 grava 3).
 */
describe('posicionarGrupo', () => {
  const ga = parseGroupId('g-a');
  const gb = parseGroupId('g-b');
  const em = (grupo: typeof ga, id: string, order?: number): Task => ({ ...tarefa(id, order), groupId: grupo }) as Task;

  /** A fila depois de aplicar as mudancas, como ids. */
  const filaDepois = (tarefas: readonly Task[], mudancas: readonly Task[]) =>
    tarefas
      .map((t) => mudancas.find((m) => m.id === t.id) ?? t)
      .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY))
      .map((t) => String(t.id));

  it('antes de uma tarefa solta: o bloco inteiro vai, e so os membros sao gravados', () => {
    const tarefas = [
      tarefa('001', 100),
      tarefa('002', 200),
      em(ga, '003', 300),
      em(ga, '004', 400),
      em(ga, '005', 500),
    ];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('002') } });

    expect(ids(mudancas).sort()).toEqual(['003', '004', '005']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['001', '003', '004', '005', '002']);
  });

  it('depois de uma tarefa solta', () => {
    const tarefas = [em(ga, '001', 100), em(ga, '002', 200), tarefa('003', 300), tarefa('004', 400)];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'after', alvo: { taskId: parseTaskId('003') } });

    expect(ids(mudancas).sort()).toEqual(['001', '002']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['003', '001', '002', '004']);
  });

  it('antes de outro grupo: passa a frente do primeiro membro dele', () => {
    const tarefas = [em(gb, '001', 100), em(gb, '002', 200), em(ga, '003', 300)];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { groupId: gb } });

    expect(ids(mudancas)).toEqual(['003']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['003', '001', '002']);
  });

  it('depois de outro grupo: fica depois do grupo inteiro, e antes do no seguinte', () => {
    const tarefas = [em(ga, '001', 100), em(gb, '002', 200), em(gb, '003', 300), tarefa('004', 400)];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'after', alvo: { groupId: gb } });

    expect(ids(mudancas)).toEqual(['001']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['002', '003', '001', '004']);
  });

  it('topo e fim da fila', () => {
    const tarefas = [tarefa('001', 100), em(ga, '002', 200), em(ga, '003', 300), tarefa('004', 400)];

    const topo = posicionarGrupo(tarefas, ga, { extremo: 'top' });
    expect(ids(topo).sort()).toEqual(['002', '003']);
    expect(filaDepois(tarefas, topo)).toEqual(['002', '003', '001', '004']);

    const fim = posicionarGrupo(tarefas, ga, { extremo: 'bottom' });
    expect(filaDepois(tarefas, fim)).toEqual(['001', '004', '002', '003']);
  });

  it('fim depois de uma cauda sem numero numera a cauda, como moveToBottom', () => {
    const tarefas = [em(ga, '001', 100), tarefa('002', 200), tarefa('003'), tarefa('004')];

    const mudancas = posicionarGrupo(tarefas, ga, { extremo: 'bottom' });

    expect(ids(mudancas).sort()).toEqual(['001', '003', '004']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['002', '003', '004', '001']);
  });

  it('as tarefas sem numero depois do ponto ficam de fora', () => {
    const tarefas = [tarefa('001', 100), em(ga, '002', 200), tarefa('003'), tarefa('004')];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('001') } });

    expect(ids(mudancas)).toEqual(['002']);
  });

  it('ja no lugar pedido, nao grava nada', () => {
    const tarefas = [em(ga, '001', 100), em(ga, '002', 200), tarefa('003', 300)];

    expect(posicionarGrupo(tarefas, ga, { extremo: 'top' })).toEqual([]);
    expect(posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('003') } })).toEqual([]);
  });

  it('um grupo sem membros nao tem o que mover', () => {
    expect(posicionarGrupo([tarefa('001', 100)], ga, { extremo: 'top' })).toEqual([]);
  });

  it('sem espaco entre os vizinhos, abre espaco na vizinhanca', () => {
    const tarefas = [tarefa('001', 1), tarefa('002', 2), em(ga, '003', 300), em(ga, '004', 400)];

    const mudancas = posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('002') } });

    expect(filaDepois(tarefas, mudancas)).toEqual(['001', '003', '004', '002']);
  });

  it('recusa um alvo que e membro do proprio grupo', () => {
    const tarefas = [em(ga, '001', 100), em(ga, '002', 200)];

    expect(() => posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('002') } })).toThrow(
      /member of group 'g-a'/,
    );
  });

  it('recusa o proprio grupo como alvo', () => {
    const tarefas = [em(ga, '001', 100)];

    expect(() => posicionarGrupo(tarefas, ga, { lado: 'after', alvo: { groupId: ga } })).toThrow(/itself/);
  });

  it('recusa uma tarefa de outro grupo como alvo, apontando o grupo', () => {
    const tarefas = [em(ga, '001', 100), em(gb, '002', 200)];

    expect(() => posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('002') } })).toThrow(/g-b/);
  });

  it('recusa alvo inexistente: tarefa, ou grupo sem membros', () => {
    const tarefas = [em(ga, '001', 100)];

    expect(() => posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { taskId: parseTaskId('999') } })).toThrow(/999/);
    expect(() => posicionarGrupo(tarefas, ga, { lado: 'before', alvo: { groupId: gb } })).toThrow(/g-b/);
  });
});

/**
 * Grupo dentro de grupo (task-119): o que se move e a subarvore inteira, e o
 * topo e o fim sao os do grupo que contem, como para uma tarefa agrupada.
 */
describe('posicionarGrupo e posicionarNoExtremo com subgrupos', () => {
  const pai = parseGroupId('g-pai');
  const sub = parseGroupId('g-sub');
  const outro = parseGroupId('g-outro');
  const grupos = [{ id: pai }, { id: sub, parentId: pai }, { id: outro }];
  const em = (grupo: typeof pai, id: string, order?: number): Task =>
    ({ ...tarefa(id, order), groupId: grupo }) as Task;
  const filaDepois = (tarefas: readonly Task[], mudancas: readonly Task[]) =>
    tarefas
      .map((t) => mudancas.find((m) => m.id === t.id) ?? t)
      .sort((a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY))
      .map((t) => String(t.id));

  it('mover o pai leva junto os membros do subgrupo, e so grava a subarvore', () => {
    const tarefas = [tarefa('001', 100), em(pai, '002', 200), em(sub, '003', 300), em(sub, '004', 400)];

    const mudancas = posicionarGrupo(tarefas, pai, { extremo: 'top' }, grupos);

    expect(ids(mudancas).sort()).toEqual(['002', '003', '004']);
    expect(filaDepois(tarefas, mudancas)).toEqual(['002', '003', '004', '001']);
  });

  it('o subgrupo vai ao topo do pai, e nao da fila inteira', () => {
    const tarefas = [tarefa('001', 100), em(pai, '002', 200), em(sub, '003', 300)];

    const mudancas = posicionarGrupo(tarefas, sub, { extremo: 'top' }, grupos);

    expect(filaDepois(tarefas, mudancas)).toEqual(['001', '003', '002']);
  });

  it('o subgrupo vai ao fim do pai, e nao da fila inteira', () => {
    const tarefas = [em(sub, '001', 100), em(pai, '002', 200), tarefa('003', 300)];

    const mudancas = posicionarGrupo(tarefas, sub, { extremo: 'bottom' }, grupos);

    expect(filaDepois(tarefas, mudancas)).toEqual(['002', '001', '003']);
  });

  it('o subgrupo se move ao lado de uma tarefa do pai', () => {
    const tarefas = [em(pai, '001', 100), em(pai, '002', 200), em(sub, '003', 300)];

    const mudancas = posicionarGrupo(tarefas, sub, { lado: 'before', alvo: { taskId: parseTaskId('002') } }, grupos);

    expect(filaDepois(tarefas, mudancas)).toEqual(['001', '003', '002']);
  });

  it('depois de um grupo com subgrupo e depois da subarvore inteira dele', () => {
    const tarefas = [em(outro, '001', 100), em(pai, '002', 200), em(sub, '003', 300), tarefa('004', 400)];

    const mudancas = posicionarGrupo(tarefas, outro, { lado: 'after', alvo: { groupId: pai } }, grupos);

    expect(filaDepois(tarefas, mudancas)).toEqual(['002', '003', '001', '004']);
  });

  it('uma tarefa do subgrupo como alvo aponta o grupo que ocupa a linha', () => {
    const tarefas = [em(outro, '001', 100), em(sub, '002', 200)];

    expect(() =>
      posicionarGrupo(tarefas, outro, { lado: 'before', alvo: { taskId: parseTaskId('002') } }, grupos),
    ).toThrow(/g-pai/);
  });

  it('recusa um alvo dentro da propria subarvore', () => {
    const tarefas = [em(pai, '001', 100), em(sub, '002', 200)];

    expect(() => posicionarGrupo(tarefas, pai, { lado: 'before', alvo: { groupId: sub } }, grupos)).toThrow(
      /inside group 'g-pai'/,
    );
  });

  it('uma tarefa do pai vai ao topo da subarvore do pai, passando o subgrupo', () => {
    const tarefas = [em(sub, '001', 100), em(pai, '002', 200), tarefa('003', 50)];

    const mudancas = posicionarNoExtremo(tarefas, parseTaskId('002'), 'top', grupos);

    expect(filaDepois(tarefas, mudancas)).toEqual(['003', '002', '001']);
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
