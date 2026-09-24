import type { Task } from '@opentask/taskin-types';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { agruparTarefas, ordenarTarefas } from './ordenar-tarefas.js';

const t = (id: string, extra: Partial<Task> = {}): Task =>
  ({ id: parseTaskId(id), title: `Tarefa ${id}`, status: 'pending', type: 'feat', ...extra }) as Task;

const ids = (ts: readonly Task[]) => ts.map((x) => String(x.id));

/**
 * A ordenacao que o dashboard ja usava, agora onde as tres superficies alcancam.
 *
 * Ela vivia em `use-prioritization.ts`, dentro do pacote **Vue** — inalcancavel
 * para a CLI e para o servidor MCP. O `taskin list` devolvia as tarefas na
 * ordem em que o provider as achava, que na pratica e por id: a coluna de
 * prioridade subia e descia sem padrao, e quem lia precisava reordenar de
 * cabeca. Foi assim que um agente autonomo escolheu uma tarefa de prioridade 30
 * tendo uma de 255 na mesma lista.
 */
describe('ordenarTarefas', () => {
  it('manual ordena por prioridade, com quem nao tem por ultimo', () => {
    const tarefas = [t('001', { order: 30 }), t('002'), t('003', { order: 10 })];

    expect(ids(ordenarTarefas(tarefas, 'manual'))).toEqual(['003', '001', '002']);
  });

  it('manual e estavel entre empatados', () => {
    const tarefas = [t('001', { order: 10 }), t('002', { order: 10 }), t('003', { order: 10 })];

    expect(ids(ordenarTarefas(tarefas, 'manual'))).toEqual(['001', '002', '003']);
  });

  it('difficulty ordena do mais facil ao mais dificil, e o inverso', () => {
    const tarefas = [t('001', { difficulty: 5 }), t('002', { difficulty: 1 }), t('003', { difficulty: 3 })];

    expect(ids(ordenarTarefas(tarefas, 'diff-asc'))).toEqual(['002', '003', '001']);
    expect(ids(ordenarTarefas(tarefas, 'diff-desc'))).toEqual(['001', '003', '002']);
  });

  it('nao altera a lista recebida', () => {
    const tarefas = [t('001', { order: 30 }), t('002', { order: 10 })];
    ordenarTarefas(tarefas, 'manual');

    expect(ids(tarefas)).toEqual(['001', '002']);
  });
});

/**
 * Agrupar e separado de ordenar, e de proposito.
 *
 * No dashboard as duas coisas vinham juntas porque a arvore era so para
 * desenhar caixas. Na saida de maquina quem consome decide — e separar deixa a
 * CLI ordenar sem agrupar quando ninguem pediu grupo.
 */
describe('agruparTarefas', () => {
  const g1 = parseGroupId('g-1');

  it('junta membros do mesmo grupo, esteja onde estiver na ordem', () => {
    const tarefas = [t('001', { groupId: g1 }), t('002'), t('003', { groupId: g1 })];

    const nos = agruparTarefas(tarefas, { 'g-1': 'Sprint' });

    expect(nos).toHaveLength(2);
    expect(nos[0]).toMatchObject({ kind: 'group', groupId: 'g-1', groupName: 'Sprint', hidden: 0 });
    expect(nos[0]?.kind === 'group' && ids(nos[0].tasks)).toEqual(['001', '003']);
  });

  /*
   * O grupo parcial, decidido: mostra os membros que casam, e diz quantos o
   * filtro escondeu. Nunca alarga o filtro para trazer o grupo inteiro.
   */
  it('diz quantos membros o filtro deixou de fora', () => {
    const tarefas = [t('001', { groupId: g1 })];

    const nos = agruparTarefas(tarefas, { 'g-1': 'Sprint' }, { 'g-1': 7 });

    expect(nos[0]).toMatchObject({ kind: 'group', hidden: 6 });
  });

  it('tarefa sem grupo fica solta, na ordem em que veio', () => {
    const nos = agruparTarefas([t('001'), t('002')], {});

    expect(nos.map((n) => n.kind)).toEqual(['task', 'task']);
  });

  it('grupo sem nome no registro ainda aparece, pelo id', () => {
    const nos = agruparTarefas([t('001', { groupId: g1 })], {});

    expect(nos[0]).toMatchObject({ kind: 'group', groupId: 'g-1', groupName: undefined });
  });
});

/*
 * Grupo dentro de grupo (task-119): o subgrupo vira um no dentro do pai, e o
 * pai ocupa o lugar do primeiro membro da subarvore inteira.
 */
describe('agruparTarefas com subgrupos', () => {
  const pai = parseGroupId('g-pai');
  const sub = parseGroupId('g-sub');
  const pais = { 'g-sub': 'g-pai' };

  it('o subgrupo fica dentro do pai, na ordem do seu primeiro membro', () => {
    const tarefas = [t('001', { groupId: pai }), t('002', { groupId: sub }), t('003', { groupId: pai }), t('004')];

    const nos = agruparTarefas(tarefas, { 'g-pai': 'Pai', 'g-sub': 'Sub' }, {}, pais);

    expect(nos.map((n) => n.kind)).toEqual(['group', 'task']);
    const [raiz] = nos;
    if (raiz?.kind !== 'group') throw new Error('esperava o grupo pai');
    expect(ids(raiz.tasks)).toEqual(['001', '003']);
    expect(raiz.groups.map((g) => [g.groupId, g.groupName, g.parentId])).toEqual([['g-sub', 'Sub', 'g-pai']]);
    expect(raiz.items.map((i) => (i.kind === 'task' ? String(i.task.id) : i.groupId))).toEqual(['001', 'g-sub', '003']);
  });

  it('o pai sem membro direto aparece onde o primeiro membro do subgrupo esta', () => {
    const tarefas = [t('001'), t('002', { groupId: sub }), t('003')];

    const nos = agruparTarefas(tarefas, {}, {}, pais);

    expect(nos.map((n) => (n.kind === 'task' ? String(n.task.id) : n.groupId))).toEqual(['001', 'g-pai', '003']);
    const grupo = nos[1];
    expect(grupo?.kind === 'group' && grupo.tasks).toEqual([]);
    expect(grupo?.kind === 'group' && grupo.groups[0]?.groupId).toBe('g-sub');
  });

  it('sem os pais, todo grupo e da raiz, como antes', () => {
    const nos = agruparTarefas([t('001', { groupId: sub })], {});

    expect(nos[0]).toMatchObject({ kind: 'group', groupId: 'g-sub', groups: [], parentId: undefined });
  });

  it('um ciclo no registro nao trava a listagem', () => {
    const nos = agruparTarefas([t('001', { groupId: sub })], {}, {}, { 'g-sub': 'g-pai', 'g-pai': 'g-sub' });

    expect(nos).toHaveLength(1);
  });
});
