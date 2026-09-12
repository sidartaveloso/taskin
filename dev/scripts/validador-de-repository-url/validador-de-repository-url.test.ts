import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { validarRepositoryUrl } from './validador-de-repository-url';

type PacoteDeTeste = {
  nome: string;
  privado?: boolean;
  repository?: unknown;
};

const criados: string[] = [];

async function criarRepo(pacotes: PacoteDeTeste[], ignorados: string[] = []): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'validador-repository-url-'));
  criados.push(raiz);

  await mkdir(join(raiz, '.changeset'), { recursive: true });
  await writeFile(join(raiz, '.changeset', 'config.json'), JSON.stringify({ ignore: ignorados }));

  for (const [indice, pacote] of pacotes.entries()) {
    const pasta = join(raiz, 'packages', `pacote-${indice}`);
    await mkdir(pasta, { recursive: true });
    const manifesto: Record<string, unknown> = { name: pacote.nome };
    if (pacote.privado) manifesto.private = true;
    if ('repository' in pacote) manifesto.repository = pacote.repository;
    await writeFile(join(pasta, 'package.json'), JSON.stringify(manifesto));
  }
  return raiz;
}

afterAll(async () => {
  await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
});

describe('validarRepositoryUrl', () => {
  it('aprova quando todo pacote publicavel declara repository.url', async () => {
    const raiz = await criarRepo([
      { nome: '@escopo/alfa', repository: { type: 'git', url: 'git+https://github.com/x/y.git' } },
      { nome: '@escopo/beta', repository: { url: 'https://github.com/x/y.git' } },
    ]);

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(0);
    expect(relatorio.itens.every((item) => item.tipo === 'ok')).toBe(true);
  });

  it('reprova o pacote sem repository.url — foi o que partiu o publish em duas passadas', async () => {
    const raiz = await criarRepo([
      { nome: '@escopo/alfa', repository: { url: 'https://github.com/x/y.git' } },
      { nome: '@escopo/ui-sense' },
    ]);

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(1);
    expect(relatorio.itens).toContainEqual(
      expect.objectContaining({ tipo: 'sem-repository-url', pacote: '@escopo/ui-sense' }),
    );
  });

  it('reprova repository.url vazio, o caso exato do E422 do sigstore', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa', repository: { type: 'git', url: '' } }]);

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(1);
    expect(relatorio.itens[0]).toMatchObject({ tipo: 'sem-repository-url', pacote: '@escopo/alfa' });
  });

  it('aceita a forma abreviada em que repository e uma string', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa', repository: 'github:x/y' }]);

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(0);
  });

  it('ignora pacotes privados: eles nao vao ao registry', async () => {
    const raiz = await criarRepo([
      { nome: '@escopo/interno', privado: true },
      { nome: '@escopo/alfa', repository: { url: 'https://github.com/x/y.git' } },
    ]);

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(0);
    expect(relatorio.itens.map((item) => item.pacote)).toEqual(['@escopo/alfa']);
  });

  it('ignora pacotes listados em ignore do changesets', async () => {
    const raiz = await criarRepo(
      [{ nome: '@escopo/docs' }, { nome: '@escopo/alfa', repository: { url: 'u' } }],
      ['@escopo/docs'],
    );

    const relatorio = await validarRepositoryUrl(raiz);

    expect(relatorio.invalidos).toBe(0);
    expect(relatorio.itens.map((item) => item.pacote)).toEqual(['@escopo/alfa']);
  });
});
