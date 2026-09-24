import { describe, expect, it } from 'vitest';
import { NOME_DE_GRUPO_NOVO, operacoesDaMudanca } from './operacoes-da-mudanca';

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
