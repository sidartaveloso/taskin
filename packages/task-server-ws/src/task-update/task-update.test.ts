import { parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { applyTaskUpdate } from './task-update.js';

type TaskFileLike = Task & { content: string; filePath: string };

const stored: TaskFileLike = {
  id: parseTaskId('020'),
  title: 'Notificacoes',
  status: 'in-progress',
  type: 'feat',
  createdAt: '2026-09-01T12:00:00.000Z',
  order: 10,
  groupId: parseGroupId('g-4f2a'),
  groupName: 'Sprint',
  difficulty: 3,
  content: '# Task 020',
  filePath: 'TASKS/task-020-notificacoes.md',
};

describe('applyTaskUpdate', () => {
  it('should keep the fields the server owns, whatever the client sends', () => {
    const outcome = applyTaskUpdate(stored, {
      id: parseTaskId('999'),
      status: 'done',
      title: 'Hijacked',
      filePath: '/etc/passwd',
      content: 'rm -rf /',
      order: 20,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.task.id).toBe('020');
    expect(outcome.task.status).toBe('in-progress');
    expect(outcome.task.title).toBe('Notificacoes');
    expect(outcome.task.filePath).toBe('TASKS/task-020-notificacoes.md');
    expect(outcome.task.content).toBe('# Task 020');
    expect(outcome.task.order).toBe(20);
  });

  it('should never leave filePath undefined, even for a payload with none', () => {
    // Este era o crash: o dashboard fala `Task`, que nao tem filePath, e o
    // provider abre com fs.readFile(task.filePath).
    const outcome = applyTaskUpdate(stored, { order: 5 });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.task.filePath).toBe('TASKS/task-020-notificacoes.md');
  });

  it('should clear the group when the key is absent', () => {
    // JSON.stringify descarta `undefined`, entao "desagrupar" chega como
    // chave ausente — tem que limpar, nao preservar.
    const outcome = applyTaskUpdate(stored, { order: 10, difficulty: 3 });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.task.groupId).toBeUndefined();
    expect(outcome.task.groupName).toBeUndefined();
  });

  it('should apply a new group', () => {
    const outcome = applyTaskUpdate(stored, { groupId: 'g-novo', groupName: 'Outro' });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.task.groupId).toBe('g-novo');
    expect(outcome.task.groupName).toBe('Outro');
  });

  it.each([
    ['difficulty out of range', { difficulty: 9 }],
    ['difficulty not an integer', { difficulty: 2.5 }],
    ['order not a number', { order: 'first' }],
    ['empty groupId', { groupId: '' }],
  ])('should reject %s', (_label, payload) => {
    const outcome = applyTaskUpdate(stored, payload);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.message).toMatch(/^Invalid task update:/);
  });

  it('should treat a missing payload as clearing everything', () => {
    const outcome = applyTaskUpdate(stored, undefined);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.task.order).toBeUndefined();
    expect(outcome.task.id).toBe('020');
  });
});
