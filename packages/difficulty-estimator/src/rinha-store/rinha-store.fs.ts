import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import { DIFFICULTY_QUESTION_VERSION } from '../difficulty-question/difficulty-question';
import { SystemOneResponseSchema } from '../system-one/system-one.schema';
import type { RawResponse } from '../system-one/system-one.types';
import type { CachedAnswer, IRinhaStore } from './rinha-store.types';

const CachedAnswerSchema: z.ZodType<CachedAnswer> = z.object({
  response: SystemOneResponseSchema,
  latencyMs: z.number(),
});

/**
 * `cache/`, `raw/` e `scoreboards/` dentro de uma pasta — no taskin,
 * `.taskin/rinhas/`, que fica fora do git.
 */
export class RinhaStoreFs implements IRinhaStore {
  constructor(private readonly dir: string) {}

  async readAnswer(key: string): Promise<CachedAnswer | undefined> {
    const texto = await lerSeExiste(this.caminho('cache', `${key}.json`));
    if (texto === undefined) return undefined;
    const lido = CachedAnswerSchema.safeParse(jsonOuNada(texto));
    return lido.success ? lido.data : undefined;
  }

  async writeAnswer(key: string, answer: CachedAnswer): Promise<void> {
    await this.escrever(['cache', `${key}.json`], JSON.stringify(answer, null, 2));
  }

  async writeRawResponse(raw: RawResponse): Promise<void> {
    await this.escrever(['raw', `${carimbo()}-${raw.provider}.json`], JSON.stringify(raw, null, 2));
  }

  async saveScoreboard(board: Scoreboard): Promise<string> {
    const nome = `${carimbo(new Date(board.generatedAt))}.json`;
    await this.escrever(['scoreboards', nome], `${JSON.stringify(board, null, 2)}\n`);
    return this.caminho('scoreboards', nome);
  }

  async latestScoreboard(): Promise<Scoreboard | undefined> {
    let nomes: string[];
    try {
      nomes = await readdir(this.caminho('scoreboards'));
    } catch {
      return undefined;
    }
    for (const nome of nomes
      .filter((n) => n.endsWith('.json'))
      .sort()
      .reverse()) {
      const placar = jsonOuNada(await readFile(this.caminho('scoreboards', nome), 'utf-8'));
      if (ehPlacarDaPerguntaAtual(placar)) return placar;
    }
    return undefined;
  }

  private caminho(...partes: string[]): string {
    return path.join(this.dir, ...partes);
  }

  private async escrever(partes: string[], conteudo: string): Promise<void> {
    const arquivo = this.caminho(...partes);
    await mkdir(path.dirname(arquivo), { recursive: true });
    await writeFile(arquivo, conteudo, 'utf-8');
  }
}

export function ehPlacarDaPerguntaAtual(valor: unknown): valor is Scoreboard {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'schema' in valor &&
    valor.schema === 1 &&
    'questionVersion' in valor &&
    valor.questionVersion === DIFFICULTY_QUESTION_VERSION
  );
}

/** ISO sem `:`, que nao e nome de arquivo em todo sistema; ordena como a data. */
function carimbo(data = new Date()): string {
  return data.toISOString().replace(/[:.]/g, '-');
}

async function lerSeExiste(arquivo: string): Promise<string | undefined> {
  try {
    return await readFile(arquivo, 'utf-8');
  } catch {
    return undefined;
  }
}

function jsonOuNada(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}
