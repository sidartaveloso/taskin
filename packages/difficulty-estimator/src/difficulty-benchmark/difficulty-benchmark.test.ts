import type { Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { taskForEstimate } from '../difficulty-question/difficulty-question';
import { EstimatorRouterMock } from '../estimator-router/estimator-router.mock';
import { answerKeyFrom, DifficultyBenchmark } from './difficulty-benchmark';
import type { AnswerKeyEntry } from './difficulty-benchmark.types';

const task = (id: string, difficulty: number): Task => ({
  id: id as Task['id'],
  title: `Tarefa ${id}`,
  type: 'feat',
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
  difficulty,
  description: `# 🧩 Task ${id} — Tarefa ${id}\n\n- Status: pending\n- Difficulty: ${difficulty}\n\n## Description\nAlgo.\n\n## Tasks\n- [ ] um\n- [ ] dois`,
});

const gabarito = (...notas: number[]): AnswerKeyEntry[] =>
  notas.map((difficulty, i) => ({
    task: taskForEstimate(task(String(i + 1).padStart(3, '0'), difficulty)),
    difficulty,
  }));

/** O modelo "acerta" devolvendo o score da nota certa, que o teste le pelo id — nunca pelo texto. */
const notaPorId = (notas: number[]) => (t: { id: string }) => (notas[Number(t.id) - 1] ?? 1) - 1;

describe('DifficultyBenchmark', () => {
  const NOTAS = [2, 4, 1, 5, 3];

  it('crowns the model that matches the human scores, ahead of the baselines', async () => {
    const router = new EstimatorRouterMock({ jev: notaPorId(NOTAS), laya: () => 1 });
    const placar = await new DifficultyBenchmark(router).run(gabarito(...NOTAS));

    expect(placar.winner).toBe('jev');
    // com dois itens em cada task a heuristica tambem diz 2: empata com always-2, e o id desempata
    expect(placar.competitors.map((c) => c.competitor)).toEqual(['jev', 'always-2', 'heuristic', 'laya']);
    expect(placar.competitors[0]).toMatchObject({ answered: 5, meanAbsoluteError: 0, exactRate: 1 });
    expect(placar.bestModel).toEqual({ estimator: 'jev', byWalkover: false, beatsBaselines: true });
    expect(placar.walkovers).toEqual([]);
    expect(placar.answerKeySize).toBe(5);
  });

  it('never hands the human score to a competitor', async () => {
    const router = new EstimatorRouterMock({ jev: () => 1, laya: () => 1 });
    await new DifficultyBenchmark(router).run(gabarito(...NOTAS));

    expect(router.perguntas).toHaveLength(NOTAS.length);
    for (const pergunta of router.perguntas) {
      expect(Object.keys(pergunta).sort()).toEqual(['id', 'markdown', 'title', 'type']);
      expect(pergunta.markdown).not.toMatch(/Difficulty/);
    }
  });

  it('gives the win by walkover when Jev did not run, saying why', async () => {
    const router = new EstimatorRouterMock({ laya: notaPorId(NOTAS) }, [
      { estimator: 'jev', reason: 'TYPESAFE_API_KEY is not set (in .env or in the environment)' },
    ]);
    const placar = await new DifficultyBenchmark(router).run(gabarito(...NOTAS));

    expect(placar.winner).toBe('laya');
    expect(placar.bestModel).toEqual({ estimator: 'laya', byWalkover: true, beatsBaselines: true });
    expect(placar.walkovers).toEqual([
      { estimator: 'jev', reason: 'TYPESAFE_API_KEY is not set (in .env or in the environment)' },
    ]);
    const jev = placar.competitors.at(-1);
    expect(jev).toMatchObject({
      competitor: 'jev',
      answered: 0,
      didNotRun: expect.stringContaining('TYPESAFE_API_KEY'),
    });
    expect(placar.rankings.accuracy).not.toContain('jev');
    expect(placar.tasks[0]?.estimates).toMatchObject({ jev: null, laya: 2, 'always-2': 2 });
  });

  it('says the best model does not beat the baselines when always-2 errs less', async () => {
    const router = new EstimatorRouterMock({ laya: () => 4 }, [{ estimator: 'jev', reason: 'no key' }]);
    const placar = await new DifficultyBenchmark(router).run(gabarito(2, 2, 2, 1));

    expect(placar.winner).toBe('always-2');
    expect(placar.bestModel).toEqual({ estimator: 'laya', byWalkover: true, beatsBaselines: false });
  });

  it('has no best model when neither Jev nor Laya ran, and a baseline still wins', async () => {
    const router = new EstimatorRouterMock({}, [
      { estimator: 'jev', reason: 'no key' },
      { estimator: 'laya', reason: 'laya is not reachable at http://localhost:8000/health (ECONNREFUSED)' },
    ]);
    const placar = await new DifficultyBenchmark(router).run(gabarito(2, 3));

    expect(placar.bestModel).toBeUndefined();
    expect(placar.walkovers.map((w) => w.estimator)).toEqual(['jev', 'laya']);
    expect(['always-2', 'heuristic']).toContain(placar.winner);
  });

  it('penalizes a model that fails some tasks, instead of averaging only what it answered', async () => {
    const router = new EstimatorRouterMock(
      { laya: (t) => (t.id === '002' ? { falha: 'laya failed (HTTP 500)' } : notaPorId(NOTAS)(t)) },
      [{ estimator: 'jev', reason: 'no key' }],
    );
    const placar = await new DifficultyBenchmark(router).run(gabarito(...NOTAS));
    const laya = placar.competitors.find((c) => c.competitor === 'laya');
    expect(laya).toMatchObject({ answered: 4, failed: 1, meanAbsoluteError: 4 / 5 });
  });

  it('reports progress task by task', async () => {
    const passos: string[] = [];
    await new DifficultyBenchmark(new EstimatorRouterMock({ jev: () => 1 })).run(gabarito(1, 2, 3), (feitas, total) =>
      passos.push(`${feitas}/${total}`),
    );
    expect(passos).toEqual(['1/3', '2/3', '3/3']);
  });
});

describe('answerKeyFrom', () => {
  it('takes every task with a human score on the scale, of any status, and strips the score', () => {
    const chave = answerKeyFrom([
      task('001', 2),
      { ...task('002', 4), status: 'done' },
      { ...task('054', 3), difficulty: 9 },
      { ...task('003', 1), difficulty: undefined },
    ]);
    expect(chave.map((e) => [e.task.id, e.difficulty])).toEqual([
      ['001', 2],
      ['002', 4],
    ]);
    expect(chave[0]?.task.markdown).not.toMatch(/Difficulty/);
  });
});
