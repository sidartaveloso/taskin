import { describe, expect, it } from 'vitest';
import { NOME_DE_GRUPO_NOVO, operacaoDoGrupo, operacaoDoMovimento, operacoesDaMudanca } from './operacoes-da-mudanca';

describe('operacoesDaMudanca — o que o quadro mudou vira operacao nomeada', () => {
  const original = { id: '001', order: 10, groupId: 'g-a', difficulty: 2 };
  const conhecidos = { 'g-a': 'A', 'g-b': 'B' };

  it('nada mudou, nada vai', () => {
    expect(operacoesDaMudanca(original, { order: 10, groupId: 'g-a', difficulty: 2 }, conhecidos)).toEqual([]);
  });

  it('prioridade nova vira set-priority', () => {
    expect(operacoesDaMudanca(original, { order: 5, groupId: 'g-a', difficulty: 2 }, conhecidos)).toEqual([
      { type: 'set-priority', payload: { taskId: '001', priority: 5 } },
    ]);
  });

  it('dificuldade nova vira set-difficulty', () => {
    expect(operacoesDaMudanca(original, { order: 10, groupId: 'g-a', difficulty: 4 }, conhecidos)).toEqual([
      { type: 'set-difficulty', payload: { taskId: '001', difficulty: 4 } },
    ]);
  });

  it('trocar para um grupo que ja existe vira assign-to-group', () => {
    expect(operacoesDaMudanca(original, { order: 10, groupId: 'g-b', difficulty: 2 }, conhecidos)).toEqual([
      { type: 'assign-to-group', payload: { taskId: '001', groupId: 'g-b' } },
    ]);
  });

  it('sair do grupo vira remove-from-group', () => {
    expect(operacoesDaMudanca(original, { order: 10, groupId: undefined, difficulty: 2 }, conhecidos)).toEqual([
      { type: 'remove-from-group', payload: { taskId: '001' } },
    ]);
  });

  /*
   * O quadro inventa o id ao agrupar duas tarefas, e `assign-to-group` recusa
   * grupo inexistente — por isso o grupo e criado antes, na mesma sequencia.
   */
  it('um grupo que o registro nao conhece e criado antes de atribuir', () => {
    expect(operacoesDaMudanca(original, { order: 10, groupId: 'g-novo', difficulty: 2 }, conhecidos)).toEqual([
      { type: 'create-group', payload: { id: 'g-novo', name: NOME_DE_GRUPO_NOVO } },
      { type: 'assign-to-group', payload: { taskId: '001', groupId: 'g-novo' } },
    ]);
  });

  it('as tres mudancas juntas vao como tres operacoes, grupo antes de prioridade', () => {
    const ops = operacoesDaMudanca(original, { order: 7, groupId: 'g-b', difficulty: 5 }, conhecidos);
    expect(ops.map((o) => o.type)).toEqual(['assign-to-group', 'set-priority', 'set-difficulty']);
  });

  it('prioridade ou dificuldade que sumiram nao viram operacao: nao ha operacao de apagar', () => {
    expect(
      operacoesDaMudanca(original, { order: undefined, groupId: 'g-a', difficulty: undefined }, conhecidos),
    ).toEqual([]);
  });
});

describe('operacaoDoMovimento — mover vai ao dominio, sem numero calculado no quadro', () => {
  it('tarefa antes ou depois de outra vira move-before ou move-after', () => {
    expect(operacaoDoMovimento({ kind: 'task', id: '003', lado: 'before', targetId: '001' })).toEqual({
      type: 'move-before',
      payload: { taskId: '003', targetId: '001' },
    });
    expect(operacaoDoMovimento({ kind: 'task', id: '003', lado: 'after', targetId: '005' })).toEqual({
      type: 'move-after',
      payload: { taskId: '003', targetId: '005' },
    });
  });

  it('grupo antes ou depois de um alvo vira move-group-before ou move-group-after', () => {
    expect(operacaoDoMovimento({ kind: 'group', id: 'g-a', lado: 'before', targetId: '001' })).toEqual({
      type: 'move-group-before',
      payload: { groupId: 'g-a', targetId: '001' },
    });
    expect(operacaoDoMovimento({ kind: 'group', id: 'g-a', lado: 'after', targetId: 'g-b' })).toEqual({
      type: 'move-group-after',
      payload: { groupId: 'g-a', targetId: 'g-b' },
    });
  });
});

/*
 * Grupo dentro de grupo (task-119): o que o quadro mudou num grupo vira a
 * operacao do dominio — criar, ja com o pai, ou mudar de pai.
 */
describe('operacaoDoGrupo', () => {
  it('um grupo novo vira create-group, com o pai e o nome padrao', () => {
    expect(operacaoDoGrupo({ id: 'g-sub', name: null, parentId: 'g-pai', novo: true })).toEqual({
      type: 'create-group',
      payload: { id: 'g-sub', name: NOME_DE_GRUPO_NOVO, parentId: 'g-pai' },
    });
  });

  it('um grupo novo da raiz vai sem pai', () => {
    expect(operacaoDoGrupo({ id: 'g-novo', name: 'Nome', novo: true })).toEqual({
      type: 'create-group',
      payload: { id: 'g-novo', name: 'Nome' },
    });
  });

  it('um grupo que ganhou pai vira nest-group, e um que perdeu, unnest-group', () => {
    expect(operacaoDoGrupo({ id: 'g-a', name: 'A', parentId: 'g-pai', novo: false })).toEqual({
      type: 'nest-group',
      payload: { groupId: 'g-a', parentId: 'g-pai' },
    });
    expect(operacaoDoGrupo({ id: 'g-a', name: 'A', novo: false })).toEqual({
      type: 'unnest-group',
      payload: { groupId: 'g-a' },
    });
  });
});
