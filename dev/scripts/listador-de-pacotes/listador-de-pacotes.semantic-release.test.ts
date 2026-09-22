import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { testesDeContrato } from './listador-de-pacotes.contract.test';
import { ListadorDePacotesSemanticRelease } from './listador-de-pacotes.semantic-release';

const criados: string[] = [];

async function criarRepo(pacotes: { nome: string; privado?: boolean }[]): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'listador-semantic-'));
  criados.push(raiz);

  const raizes: string[] = [];
  for (const [indice, pacote] of pacotes.entries()) {
    const relativo = join('packages', `pacote-${indice}`);
    raizes.push(relativo);
    await mkdir(join(raiz, relativo), { recursive: true });
    await writeFile(
      join(raiz, relativo, 'package.json'),
      JSON.stringify({ name: pacote.nome, ...(pacote.privado ? { private: true } : {}) }),
    );
  }

  await writeFile(
    join(raiz, '.releaserc.json'),
    JSON.stringify({
      plugins: [
        '@semantic-release/commit-analyzer',
        ...raizes.map((pkgRoot) => ['@semantic-release/npm', { pkgRoot }]),
      ],
    }),
  );
  return raiz;
}

afterAll(async () => {
  await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
});

describe('ListadorDePacotesSemanticRelease', () => {
  testesDeContrato(async (pacotes) => new ListadorDePacotesSemanticRelease(await criarRepo(pacotes)));

  it('ignora pacote declarado no .releaserc.json que nao existe em disco', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa' }]);
    await writeFile(
      join(raiz, '.releaserc.json'),
      JSON.stringify({
        plugins: [
          ['@semantic-release/npm', { pkgRoot: 'packages/pacote-0' }],
          ['@semantic-release/npm', { pkgRoot: 'packages/sumiu' }],
        ],
      }),
    );

    await expect(new ListadorDePacotesSemanticRelease(raiz).listar()).resolves.toEqual(['@escopo/alfa']);
  });
});
