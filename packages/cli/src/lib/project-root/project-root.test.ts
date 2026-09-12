import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findProjectRoot } from './project-root.js';

let base: string;

function criar(caminhoRelativo: string, conteudo = '{}'): string {
  const caminho = join(base, caminhoRelativo);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo, 'utf-8');
  return caminho;
}

function pasta(caminhoRelativo: string): string {
  const caminho = join(base, caminhoRelativo);
  mkdirSync(caminho, { recursive: true });
  return caminho;
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'taskin-root-'));
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

/**
 * A raiz do projeto e o diretorio que tem `.taskin.json`.
 *
 * Nada subia ate ela de forma reutilizavel. O `isTaskinProject` so olhava o
 * cwd; o `detectPackageManager` fazia `existsSync('pnpm-lock.yaml')` relativo
 * ao cwd — de um subdiretorio nao achava nada e caia em `npm` em silencio; e o
 * `dashboard` subia por conta propria procurando `pnpm-workspace.yaml`, que e o
 * marcador errado: num projeto yarn ou npm ele sobe ate `/` sem achar.
 *
 * `.taskin.json` e o marcador certo porque e o que o `taskin init` escreve.
 */
describe('findProjectRoot', () => {
  it('acha quando ja se esta na raiz', () => {
    criar('.taskin.json');

    expect(findProjectRoot(base)).toBe(base);
  });

  it('sobe a partir de um subdiretorio', () => {
    criar('.taskin.json');
    const sub = pasta('packages/cli');

    expect(findProjectRoot(sub)).toBe(base);
  });

  it('sobe varios niveis', () => {
    criar('.taskin.json');
    const fundo = pasta('packages/cli/src/lib/mcp-install');

    expect(findProjectRoot(fundo)).toBe(base);
  });

  it('devolve undefined quando nao ha projeto nenhum acima', () => {
    const orfao = pasta('sem/projeto/aqui');

    expect(findProjectRoot(orfao)).toBeUndefined();
  });

  it('vence o mais proximo quando ha um projeto dentro de outro', () => {
    criar('.taskin.json');
    criar('packages/interno/.taskin.json');
    const dentro = pasta('packages/interno/src');

    expect(findProjectRoot(dentro)).toBe(join(base, 'packages/interno'));
  });

  it('nao confunde diretorio chamado .taskin.json com o arquivo', () => {
    pasta('.taskin.json');
    const sub = pasta('packages/cli');

    expect(findProjectRoot(sub)).toBeUndefined();
  });
});
