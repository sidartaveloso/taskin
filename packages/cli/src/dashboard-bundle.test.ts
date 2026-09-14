import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(import.meta.dirname, '..', '..', '..');
const SERVIDO = join(RAIZ, 'packages', 'cli', 'dashboard-dist');

/** Data do arquivo mais novo sob `dir`, entre as extensoes que compoem o bundle. */
function maisNovo(dir: string, extensoes: string[]): { caminho: string; ms: number } | undefined {
  if (!existsSync(dir)) return undefined;
  let melhor: { caminho: string; ms: number } | undefined;

  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name === 'dist' || entrada.name.startsWith('.')) continue;
    const caminho = join(dir, entrada.name);
    const achado = entrada.isDirectory()
      ? maisNovo(caminho, extensoes)
      : extensoes.some((e) => entrada.name.endsWith(e))
        ? { caminho, ms: statSync(caminho).mtimeMs }
        : undefined;
    if (achado && (!melhor || achado.ms > melhor.ms)) melhor = achado;
  }

  return melhor;
}

/**
 * O bundle que o `taskin dashboard` serve tem que ser mais novo que o fonte.
 *
 * O comando serve `packages/cli/dashboard-dist`, produzido pelo script
 * `build:dashboard`. Esse diretorio ficou de fora dos `outputs` declarados do
 * turbo, entao um acerto de cache restaurava o `dist/` e deixava o bundle do
 * dashboard como estava.
 *
 * O sintoma e cruel porque nao parece defeito de build: o dashboard se comporta
 * como o codigo de horas atras, e quem esta medindo conclui que a mudanca que
 * acabou de escrever nao funcionou. Foi o que aconteceu ao medir a task-082 —
 * 499 arquivos reescritos por um clique que ja tinha sido consertado, e o que
 * desfez a armadilha foi comparar as datas.
 *
 * Esta guarda compara as mesmas datas, automaticamente.
 */
describe('o bundle servido do dashboard', () => {
  it('nao e mais antigo que o fonte que o compoe', () => {
    const bundle = maisNovo(SERVIDO, ['.js']);
    if (!bundle) {
      // Sem build ainda; nada a afirmar. O `taskin#build` roda antes do `test`.
      expect(existsSync(SERVIDO)).toBe(false);
      return;
    }

    const fontes = [
      maisNovo(join(RAIZ, 'packages', 'dashboard', 'src'), ['.ts', '.vue']),
      maisNovo(join(RAIZ, 'packages', 'design-vue', 'src'), ['.ts', '.vue']),
    ].filter((f): f is { caminho: string; ms: number } => f !== undefined);

    const maisNovoFonte = fontes.reduce((a, b) => (a.ms > b.ms ? a : b));

    expect(
      bundle.ms >= maisNovoFonte.ms,
      `O bundle servido (${new Date(bundle.ms).toISOString()}) e mais antigo que ` +
        `${maisNovoFonte.caminho} (${new Date(maisNovoFonte.ms).toISOString()}). ` +
        'Rode `pnpm --filter taskin run build:dashboard`.',
    ).toBe(true);
  });
});
