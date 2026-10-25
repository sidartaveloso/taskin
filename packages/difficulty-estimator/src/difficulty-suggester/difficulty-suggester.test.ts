import type { Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { QuantileCalibration } from '../calibration/calibration';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { EstimatorRouterMock } from '../estimator-router/estimator-router.mock';
import { parseSuggestionSource } from '../estimators/estimators';
import type { SuggestionSource } from '../estimators/estimators.types';
import { placar } from '../rinha-store/rinha-store.contract';
import { chooseSource, DifficultySuggester, unscoredOpenTasks } from './difficulty-suggester';

const TASKS: TaskForEstimate[] = [
  { id: '142', title: 'Uma', type: 'feat', markdown: '' },
  { id: '143', title: 'Outra', type: 'fix', markdown: '' },
];

const fonte = (id: string): SuggestionSource => {
  const source = parseSuggestionSource(id);
  if (!source) throw new Error(id);
  return source;
};

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
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, fonte('laya'));
    expect(uma?.chosen).toEqual({ source: 'laya', difficulty: 2 });
  });

  it('reads a calibrated source through the calibration, not the raw score', async () => {
    const router = new EstimatorRouterMock({ jev: () => 3.05 });
    const calibracao = new QuantileCalibration([
      { score: 2.5, human: 1 },
      { score: 3.0, human: 2 },
      { score: 3.1, human: 2 },
      { score: 3.6, human: 3 },
      { score: 3.9, human: 5 },
    ]);
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, fonte('jev-calibrated'), calibracao);
    expect(uma?.chosen).toEqual({ source: 'jev-calibrated', difficulty: 2 });
    expect(uma?.outcomes[0]).toMatchObject({ kind: 'answered', estimate: { difficulty: 4 } });
  });

  it('suggests nothing from a calibrated source without a calibration', async () => {
    const router = new EstimatorRouterMock({ jev: () => 3 });
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, fonte('jev-calibrated'));
    expect(uma?.chosen).toBeUndefined();
  });

  it('has no agreement to tell, and no suggestion, when the chosen model did not run', async () => {
    const router = new EstimatorRouterMock({ laya: () => 1 }, [{ estimator: 'jev', reason: 'no key' }]);
    const [uma] = await new DifficultySuggester(router).suggest(TASKS, fonte('jev'));
    expect(uma).not.toHaveProperty('agreement');
    expect(uma?.chosen).toBeUndefined();
    expect(uma?.outcomes[0]).toEqual({ kind: 'unavailable', estimator: 'jev', reason: 'no key' });
  });
});

describe('chooseSource', () => {
  const venceu = (source: 'laya' | 'jev-calibrated', beatsBaselines: boolean, byWalkover = false) =>
    placar('2026-09-29T10:00:00.000Z', { bestModel: { source, byWalkover, beatsBaselines } });

  it('honours --by above anything', () => {
    expect(chooseSource(venceu('laya', true), fonte('jev'))).toMatchObject({
      kind: 'chosen',
      source: { id: 'jev', calibrated: false },
    });
  });

  it('chooses nobody before the first rinha', () => {
    expect(chooseSource(undefined)).toMatchObject({
      kind: 'none',
      why: expect.stringContaining('taskin estimate --rinha'),
    });
  });

  it('chooses the winner of the last rinha, saying when it was by walkover', () => {
    expect(chooseSource(venceu('laya', true, true))).toEqual({
      kind: 'chosen',
      source: { id: 'laya', estimator: 'laya', calibrated: false },
      why: 'laya won the last rinha (by walkover)',
    });
  });

  it('chooses a calibrated winner as a calibrated source', () => {
    expect(chooseSource(venceu('jev-calibrated', true))).toMatchObject({
      kind: 'chosen',
      source: { id: 'jev-calibrated', estimator: 'jev', calibrated: true },
    });
  });

  it('chooses nobody when the winner did not beat the baselines', () => {
    expect(chooseSource(venceu('laya', false))).toMatchObject({
      kind: 'none',
      why: expect.stringContaining('did not beat the baselines'),
    });
  });

  it('chooses nobody when no model answered in the last rinha', () => {
    expect(chooseSource(placar('2026-09-29T10:00:00.000Z'))).toMatchObject({ kind: 'none' });
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
