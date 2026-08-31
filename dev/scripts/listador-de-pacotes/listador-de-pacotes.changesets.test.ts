import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ListadorDePacotesChangesets } from './listador-de-pacotes.changesets';
import { testesDeContrato } from './listador-de-pacotes.contract.test';

const criados: string[] = [];

async function criarRepo(pacotes: { nome: string; privado?: boolean }[], ignorados: string[] = []): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'listador-changesets-'));
  criados.push(raiz);

  await mkdir(join(raiz, '.changeset'), { recursive: true });
  await writeFile(join(raiz, '.changeset', 'config.json'), JSON.stringify({ ignore: ignorados }));

  for (const [indice, pacote] of pacotes.entries()) {
    const pasta = join(raiz, 'packages', `pacote-${indice}`);
    await mkdir(pasta, { recursive: true });
    await writeFile(
      join(pasta, 'package.json'),
      JSON.stringify({ name: pacote.nome, ...(pacote.privado ? { private: true } : {}) }),
    );
  }
  return raiz;
}

afterAll(async () => {
  await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
});

describe('ListadorDePacotesChangesets', () => {
  testesDeContrato(async (pacotes) => new ListadorDePacotesChangesets(await criarRepo(pacotes)));

  it('omite os pacotes listados em ignore do changesets', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa' }, { nome: '@escopo/docs' }], ['@escopo/docs']);

    await expect(new ListadorDePacotesChangesets(raiz).listar()).resolves.toEqual(['@escopo/alfa']);
  });

  it('ignora pacote com package.json ilegivel em vez de derrubar a listagem', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa' }]);
    const quebrado = join(raiz, 'packages', 'quebrado');
    await mkdir(quebrado, { recursive: true });
    await writeFile(join(quebrado, 'package.json'), '{ isto nao e json');

    await expect(new ListadorDePacotesChangesets(raiz).listar()).resolves.toEqual(['@escopo/alfa']);
  });
});
