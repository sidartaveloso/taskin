import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verificarCargaEsm } from './verificador-de-carga-esm';

const raizDoRepo = resolve(import.meta.dirname, '..', '..', '..');

/**
 * Roda sobre os `dist` do repo. No `pnpm test` eles ja existem: o `test` de
 * cada pacote depende do `build` no turbo, e o `test:dev-scripts` vem depois.
 */
describe('pacotes publicaveis do taskin', () => {
  it('carregam no Node ESM como saem para o registry', { timeout: 180_000 }, async () => {
    const relatorio = await verificarCargaEsm(raizDoRepo);

    // Os que quebraram em 2026-10-01: sem eles na lista, a verificacao passaria vazia.
    expect(relatorio.itens.map((item) => item.pacote)).toEqual(
      expect.arrayContaining([
        '@opentask/taskin-file-system-provider',
        '@opentask/taskin-git-utils',
        '@opentask/taskin-utils',
      ]),
    );
    expect(relatorio.itens.filter((item) => item.tipo === 'falha')).toEqual([]);
  });
});
