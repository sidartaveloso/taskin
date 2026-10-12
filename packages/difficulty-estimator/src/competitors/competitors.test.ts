import { testarBaseAlgoritmo } from '@rinhany/testing';
import { describe, expect, it } from 'vitest';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { EstimatorRouterMock } from '../estimator-router/estimator-router.mock';
import {
  CompetitorDidNotAnswer,
  ConstantBaseline,
  competitorsFor,
  HeuristicBaseline,
  heuristicDifficulty,
  ModelCompetitor,
  SharedAsk,
} from './competitors';

const TASK: TaskForEstimate = { id: '001', title: 'X', type: 'feat', markdown: '# X\n\n## Description\nAlgo.' };

const itens = (n: number) =>
  `# X\n\n## Description\nAlgo.\n\n## Tasks\n${Array.from({ length: n }, (_, i) => `- [ ] item ${i}`).join('\n')}\n\n## Notes\n- nao conta`;

for (const competidor of competitorsFor(new EstimatorRouterMock({}))) {
  testarBaseAlgoritmo(() => competidor, { descricaoBloco: `${competidor.nome} — rinhany BaseAlgoritmo contract` });
}

describe('ModelCompetitor', () => {
  it('returns the model answer, with confidence, latency and tokens', async () => {
    const ask = new SharedAsk(new EstimatorRouterMock({ jev: () => 3.1 }));
    expect(await new ModelCompetitor('jev', ask).estimate(TASK)).toEqual({
      difficulty: 4,
      confidence: 0.5,
      latencyMs: 200,
      inputTokens: 100,
    });
  });

  it('does not answer, with the reason, when the model did not run', async () => {
    const router = new EstimatorRouterMock({}, [{ estimator: 'jev', reason: 'TYPESAFE_API_KEY is not set' }]);
    const promessa = new ModelCompetitor('jev', new SharedAsk(router)).estimate(TASK);
    await expect(promessa).rejects.toBeInstanceOf(CompetitorDidNotAnswer);
    await expect(promessa).rejects.toThrow('TYPESAFE_API_KEY is not set');
  });

  it('does not answer when the model failed on this task', async () => {
    const ask = new SharedAsk(new EstimatorRouterMock({ laya: () => ({ falha: 'laya failed (HTTP 500)' }) }));
    await expect(new ModelCompetitor('laya', ask).estimate(TASK)).rejects.toThrow('laya failed (HTTP 500)');
  });

  it('shares one question per task between Jev and Laya', async () => {
    const router = new EstimatorRouterMock({ jev: () => 1, laya: () => 2 });
    const ask = new SharedAsk(router);
    await new ModelCompetitor('jev', ask).estimate(TASK);
    await new ModelCompetitor('laya', ask).estimate(TASK);
    expect(router.perguntas).toHaveLength(1);
  });
});

describe('baselines', () => {
  it('always-2 answers 2 for anything', async () => {
    expect((await new ConstantBaseline(2).estimate()).difficulty).toBe(2);
    expect(new ConstantBaseline(2).id).toBe('always-2');
  });

  it('refuses a constant outside the scale', () => {
    expect(() => new ConstantBaseline(9)).toThrow(/Invalid difficulty/);
  });

  it.each([
    [1, 1],
    [3, 2],
    [6, 3],
    [10, 4],
    [11, 5],
  ])('heuristic: %s items under ## Tasks give %s', (n, dificuldade) => {
    expect(heuristicDifficulty(itens(n))).toBe(dificuldade);
  });

  it('heuristic: without items, measures the text', async () => {
    expect(heuristicDifficulty('# X\n\n## Description\ncurto')).toBe(1);
    expect(heuristicDifficulty(`# X\n\n## Description\n${'x'.repeat(5000)}`)).toBe(5);
    expect((await new HeuristicBaseline().estimate({ ...TASK, markdown: itens(4) })).difficulty).toBe(3);
  });
});
