import { statSync } from 'node:fs';
import path from 'node:path';

/** O arquivo que marca a raiz — e o que o `taskin init` escreve. */
const MARCADOR = '.taskin.json';

/** `statSync` lanca quando nao existe; aqui isso significa "nao e a raiz". */
function temMarcador(diretorio: string): boolean {
  try {
    return statSync(path.join(diretorio, MARCADOR)).isFile();
  } catch {
    return false;
  }
}

/**
 * A raiz do projeto taskin a partir de um diretorio qualquer, subindo.
 *
 * Existe porque quase nada subia: `isTaskinProject` so olhava o cwd e o
 * `detectPackageManager` fazia `existsSync('pnpm-lock.yaml')` relativo a ele —
 * de um subdiretorio nao achava lockfile e caia em `npm` sem avisar. O
 * `dashboard` subia, mas procurando `pnpm-workspace.yaml`, que so existe em
 * monorepo pnpm.
 *
 * Vence o marcador **mais proximo**: um projeto taskin dentro de outro e uma
 * configuracao legitima, e quem esta dentro pertence ao de dentro.
 *
 * @param startDir - Onde comecar a procurar; normalmente o cwd
 * @returns O diretorio que contem `.taskin.json`, ou `undefined`
 * @public
 */
export function findProjectRoot(startDir: string = process.cwd()): string | undefined {
  let atual = path.resolve(startDir);

  // `path.dirname('/')` devolve `/`: e assim que se sabe que chegou ao topo.
  while (true) {
    if (temMarcador(atual)) return atual;

    const acima = path.dirname(atual);
    if (acima === atual) return undefined;
    atual = acima;
  }
}
