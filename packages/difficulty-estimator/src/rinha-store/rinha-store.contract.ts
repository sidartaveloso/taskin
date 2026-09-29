import { describe, expect, it } from 'vitest';
import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import { DIFFICULTY_QUESTION_VERSION } from '../difficulty-question/difficulty-question';
import type { CachedAnswer, IRinhaStore } from './rinha-store.types';

const RESPOSTA: CachedAnswer['response'] = {
  model: 'laya-rl-agent',
  answers: {
    difficulty: { type: 'score', score: 1.2, legend: { '0': 'a' }, probabilities: { '0': 0.3, '1': 0.7 } },
  },
  usage: { input_tokens: 73, output_tokens: 0 },
};

export const placar = (generatedAt: string, extra: Partial<Scoreboard> = {}): Scoreboard => ({
  schema: 1,
  questionVersion: DIFFICULTY_QUESTION_VERSION,
  generatedAt,
  answerKeySize: 0,
  competitors: [],
  rankings: {},
  walkovers: [],
  tasks: [],
  ...extra,
});

/** O comportamento de todo `IRinhaStore`, escrito uma vez (padroes/estrutura-de-modulos.md). */
export function rinhaStoreContract(create: () => IRinhaStore): void {
  describe('IRinhaStore — contract', () => {
    it('gives back the answer written under a key, and nothing under another', async () => {
      const store = create();
      const guardada: CachedAnswer = { response: RESPOSTA, latencyMs: 412 };
      await store.writeAnswer('k1', guardada);
      expect(await store.readAnswer('k1')).toEqual(guardada);
      expect(await store.readAnswer('k2')).toBeUndefined();
    });

    it('has no scoreboard before the first rinha', async () => {
      expect(await create().latestScoreboard()).toBeUndefined();
    });

    it('returns the newest scoreboard', async () => {
      const store = create();
      await store.saveScoreboard(placar('2026-09-01T10:00:00.000Z', { winner: 'antigo' }));
      await store.saveScoreboard(placar('2026-09-29T10:00:00.000Z', { winner: 'novo' }));
      await store.saveScoreboard(placar('2026-09-15T10:00:00.000Z', { winner: 'meio' }));
      expect((await store.latestScoreboard())?.winner).toBe('novo');
    });

    it('ignores a scoreboard of another version of the question', async () => {
      const store = create();
      await store.saveScoreboard(placar('2026-09-01T10:00:00.000Z', { winner: 'desta' }));
      await store.saveScoreboard(
        placar('2026-09-29T10:00:00.000Z', { winner: 'de outra', questionVersion: DIFFICULTY_QUESTION_VERSION + 1 }),
      );
      expect((await store.latestScoreboard())?.winner).toBe('desta');
    });

    it('accepts a raw response without failing', async () => {
      await expect(
        create().writeRawResponse({ provider: 'jev', status: 200, body: '<html>', reason: 'the body is not JSON' }),
      ).resolves.toBeUndefined();
    });
  });
}
