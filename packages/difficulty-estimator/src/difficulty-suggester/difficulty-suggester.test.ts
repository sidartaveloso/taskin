import type { Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { EstimatorRouterMock } from '../estimator-router/estimator-router.mock';
import { placar } from '../rinha-store/rinha-store.contract';
import { chooseEstimator, DifficultySuggester, unscoredOpenTasks } from './difficulty-suggester';

const TASKS: TaskForEstimate[] = [
  { id: '142', title: 'Uma', type: 'feat', markdown: '' },
  { id: '143', title: 'Outra', type: 'fix', markdown: '' },
];

describe('DifficultySuggester', () => {
  it('shows what each model said, and whether they agree', async () => {
    const router = new EstimatorRouterMock({ jev: (t) => (t.id === '142' ? 1 : 3), laya: () => 1 });
    const [uma, outra] = await new DifficultySuggester(router).suggest(TASKS);

    expect(uma?.outcomes.map((o) => (o.kind === 'answered' ? o.estimate.difficulty : o.kind))).toEqual([2, 2]);
    expect(uma?.agreement).toBe(true);
    expect(outra?.agreement).toBe(false);
    expect(uma?.chosen).toBeUndefined();
  });

  it("takes the chosen model's answer as the suggestion", async () => {
    const router = new EstimatorRouterMock({ jev: () => 3, laya: () => 1 });
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, 'laya');
    expect(uma?.chosen).toEqual({ estimator: 'laya', difficulty: 2 });
  });

  it('has no agreement to tell, and no suggestion, when the chosen model did not run', async () => {
    const router = new EstimatorRouterMock({ laya: () => 1 }, [{ estimator: 'jev', reason: 'no key' }]);
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, 'jev');
    expect(uma).not.toHaveProperty('agreement');
    expect(uma?.chosen).toBeUndefined();
    expect(uma?.outcomes[0]).toEqual({ kind: 'unavailable', estimator: 'jev', reason: 'no key' });
  });
});

describe('chooseEstimator', () => {
  const venceu = (beatsBaselines: boolean, byWalkover = false) =>
    placar('2026-09-29T10:00:00.000Z', { bestModel: { estimator: 'laya', byWalkover, beatsBaselines } });

  it('honours --by above anything', () => {
    expect(chooseEstimator(venceu(true), 'jev')).toMatchObject({ kind: 'chosen', estimator: 'jev' });
  });

  it('chooses nobody before the first rinha', () => {
    expect(chooseEstimator(undefined)).toMatchObject({
      kind: 'none',
      why: expect.stringContaining('taskin estimate --rinha'),
    });
  });

  it('chooses the winner of the last rinha, saying when it was by walkover', () => {
    expect(chooseEstimator(venceu(true, true))).toEqual({
      kind: 'chosen',
      estimator: 'laya',
      why: 'laya won the last rinha (by walkover)',
    });
  });

  it('chooses nobody when the winner did not beat the baselines', () => {
    expect(chooseEstimator(venceu(false))).toMatchObject({
      kind: 'none',
      why: expect.stringContaining('did not beat the baselines'),
    });
  });

  it('chooses nobody when no model answered in the last rinha', () => {
    expect(chooseEstimator(placar('2026-09-29T10:00:00.000Z'))).toMatchObject({ kind: 'none' });
  });
});

describe('unscoredOpenTasks', () => {
  const task = (id: string, status: Task['status'], difficulty?: number): Task => ({
    id: id as Task['id'],
    title: id,
    type: 'feat',
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    difficulty,
  });

  it('keeps the open tasks without a score, and leaves out done and canceled', () => {
    const alvos = unscoredOpenTasks([
      task('001', 'pending'),
      task('002', 'in-progress'),
      task('003', 'pending', 3),
      task('004', 'done'),
      task('005', 'canceled'),
      task('006', 'paused', 9),
    ]);
    expect(alvos.map((t) => t.id)).toEqual(['001', '002', '006']);
  });
});
