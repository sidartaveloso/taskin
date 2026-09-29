import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import type { RawResponse, SystemOneResponse } from '../system-one/system-one.types';

/** A resposta e quanto ela levou: o placar de velocidade nao zera quando vem do cache. */
export interface CachedAnswer {
  readonly response: SystemOneResponse;
  readonly latencyMs: number;
}

/**
 * O que a rinha guarda: respostas por chave (o cache), respostas que nao
 * deram para ler, e os placares. Nada disso e nota — a nota so muda por
 * `setDifficulty`.
 */
export interface IRinhaStore {
  readAnswer(key: string): Promise<CachedAnswer | undefined>;
  writeAnswer(key: string, answer: CachedAnswer): Promise<void>;
  writeRawResponse(raw: RawResponse): Promise<void>;
  /** Devolve onde ficou. */
  saveScoreboard(board: Scoreboard): Promise<string>;
  /** O placar mais novo da pergunta atual; de outra versao da pergunta nao serve. */
  latestScoreboard(): Promise<Scoreboard | undefined>;
}
