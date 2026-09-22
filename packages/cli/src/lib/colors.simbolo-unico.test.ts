import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Quem coloca o simbolo e o helper, e so ele.
 *
 * `success`, `error`, `info` e `warning` ja prefixam `✓`, `✗`, `ℹ` e `⚠`. Uma
 * chamada que passa a mensagem comecando pelo mesmo simbolo imprime dois:
 *
 *     ✓ ✓ Created .taskin.json
 *     ✓ ✓ User "..." created successfully!
 *
 * Eram 24 chamadas assim em 8 arquivos, e nenhum teste percebia porque nenhum
 * olhava a saida. Este olha o fonte: e mais barato que afirmar a saida de cada
 * comando, e pega a regressao no lugar em que ela nasce.
 */
const SIMBOLOS = ['✓', '✗', 'ℹ', '⚠'];
const CHAMADA_COM_SIMBOLO = new RegExp(String.raw`\b(?:success|error|info|warning)\(\s*(['"\`])[${SIMBOLOS.join('')}]`);

const RAIZ = join(import.meta.dirname, '..');

function arquivosTs(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosTs(caminho);
    return nome.endsWith('.ts') && !nome.endsWith('.test.ts') ? [caminho] : [];
  });
}

describe('colors — o simbolo vem do helper, nao da mensagem', () => {
  it('nenhuma chamada passa mensagem comecando pelo proprio simbolo', () => {
    const infratores = arquivosTs(RAIZ)
      .filter((caminho) => !caminho.endsWith(join('lib', 'colors.ts')))
      .flatMap((caminho) =>
        readFileSync(caminho, 'utf-8')
          .split('\n')
          .map((linha, indice) => ({ caminho, linha: indice + 1, texto: linha }))
          .filter(({ texto }) => CHAMADA_COM_SIMBOLO.test(texto)),
      )
      .map(({ caminho, linha, texto }) => `${caminho.replace(RAIZ, 'src')}:${linha} ${texto.trim()}`);

    expect(infratores).toEqual([]);
  });
});
