import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import type { RawResponse } from '../system-one/system-one.types';
import { ehPlacarDaPerguntaAtual } from './rinha-store.fs';
import type { CachedAnswer, IRinhaStore } from './rinha-store.types';

/** Para os testes de quem usa a rinha: guarda tudo em memoria, e deixa ver o que guardou. */
export class RinhaStoreMemory implements IRinhaStore {
  readonly answers = new Map<string, CachedAnswer>();
  readonly raw: RawResponse[] = [];
  readonly scoreboards: Scoreboard[] = [];

  async readAnswer(key: string): Promise<CachedAnswer | undefined> {
    return this.answers.get(key);
  }

  async writeAnswer(key: string, answer: CachedAnswer): Promise<void> {
    this.answers.set(key, answer);
  }

  async writeRawResponse(raw: RawResponse): Promise<void> {
    this.raw.push(raw);
  }

  async saveScoreboard(board: Scoreboard): Promise<string> {
    this.scoreboards.push(board);
    return `memory://scoreboards/${this.scoreboards.length}`;
  }

  async latestScoreboard(): Promise<Scoreboard | undefined> {
    return [...this.scoreboards]
      .sort((a, b) => a.generatedAt.localeCompare(b.generatedAt))
      .reverse()
      .find(ehPlacarDaPerguntaAtual);
  }
}
