import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A guarda contra o teste que nao testa nada.
 *
 * Trinta corpos de teste tinham como unico conteudo `expect(true).toBe(true)`,
 * sob nomes que prometiam comportamento real. Passavam sempre, inclusive se o
 * comando quebrasse. A forma ja voltou quatro vezes; este teste falha assim que
 * ela reaparecer, no lugar em que nasce. Precedente no repositorio:
 * `colors.simbolo-unico.test.ts` e `documented-tools.test.ts`.
 */
const ASSERCAO_VAZIA = new RegExp(['expect', '\\(', 'true', '\\)', '\\.', 'toBe', '\\(', 'true', '\\)'].join('\\s*'));

const RAIZ = join(import.meta.dirname);
const ESTE_ARQUIVO = join(import.meta.dirname, 'no-empty-test-bodies.test.ts');

function arquivosDeTeste(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDeTeste(caminho);
    return nome.endsWith('.test.ts') ? [caminho] : [];
  });
}

describe('testes de verdade — nenhum corpo afirma expect(true)', () => {
  it('nenhum arquivo de teste contem a assercao vazia', () => {
    const infratores = arquivosDeTeste(RAIZ)
      .filter((caminho) => caminho !== ESTE_ARQUIVO)
      .flatMap((caminho) =>
        readFileSync(caminho, 'utf-8')
          .split('\n')
          .map((linha, indice) => ({ caminho, linha: indice + 1, texto: linha }))
          .filter(({ texto }) => ASSERCAO_VAZIA.test(texto)),
      )
      .map(({ caminho, linha, texto }) => `${caminho.replace(RAIZ, 'src')}:${linha} ${texto.trim()}`);

    expect(infratores).toEqual([]);
  });
});
