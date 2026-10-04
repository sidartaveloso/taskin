import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { verificarCargaEsm } from './verificador-de-carga-esm';

type PacoteDeTeste = {
  manifesto: Record<string, unknown>;
  /** Caminho relativo a pasta do pacote → conteudo. */
  arquivos: Record<string, string>;
};

const PRAZO = 30_000;

const criados: string[] = [];

async function criarRepo(pacotes: PacoteDeTeste[], ignorados: string[] = []): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'verificador-de-carga-esm-'));
  criados.push(raiz);

  await mkdir(join(raiz, '.changeset'), { recursive: true });
  await writeFile(join(raiz, '.changeset', 'config.json'), JSON.stringify({ ignore: ignorados }));

  for (const [indice, pacote] of pacotes.entries()) {
    const pasta = join(raiz, 'packages', `pacote-${indice}`);
    await mkdir(pasta, { recursive: true });
    await writeFile(join(pasta, 'package.json'), JSON.stringify({ version: '1.0.0', ...pacote.manifesto }));
    for (const [relativo, conteudo] of Object.entries(pacote.arquivos)) {
      await mkdir(dirname(join(pasta, relativo)), { recursive: true });
      await writeFile(join(pasta, relativo), conteudo);
    }
  }
  return raiz;
}

function biblioteca(
  nome: string,
  arquivos: Record<string, string>,
  extra: Record<string, unknown> = {},
): PacoteDeTeste {
  return {
    manifesto: { name: nome, type: 'module', main: 'dist/index.js', files: ['dist'], ...extra },
    arquivos,
  };
}

afterAll(async () => {
  await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
});

describe('verificarCargaEsm', () => {
  it(
    'carrega a biblioteca cujo dist importa os arquivos irmaos com a extensao .js',
    async () => {
      const raiz = await criarRepo([
        biblioteca('@escopo/alfa', {
          'dist/index.js': "export * from './security.js';\n",
          'dist/security.js': 'export const seguro = true;\n',
        }),
      ]);

      await expect(verificarCargaEsm(raiz)).resolves.toEqual({
        itens: [{ tipo: 'ok', pacote: '@escopo/alfa', forma: { tipo: 'import' } }],
        falhas: 0,
      });
    },
    PRAZO,
  );

  it(
    'reprova o import relativo sem extensao — o defeito do taskin-utils 1.1.1',
    async () => {
      const raiz = await criarRepo([
        biblioteca('@escopo/alfa', {
          'dist/index.js': "export * from './security';\n",
          'dist/security.js': 'export const seguro = true;\n',
        }),
      ]);

      const relatorio = await verificarCargaEsm(raiz);

      expect(relatorio.falhas).toBe(1);
      expect(relatorio.itens[0]).toMatchObject({ tipo: 'falha', pacote: '@escopo/alfa' });
      const [item] = relatorio.itens;
      expect(item?.tipo === 'falha' && item.erro).toMatch(
        /ERR_MODULE_NOT_FOUND.*'node_modules\/@escopo\/alfa\/dist\/security'/,
      );
    },
    PRAZO,
  );

  it(
    'carrega o tarball, nao a pasta: arquivo que o files deixa fora nao chega ao consumidor',
    async () => {
      const raiz = await criarRepo([
        biblioteca('@escopo/alfa', {
          'dist/index.js': "export * from '../lib/a.js';\n",
          'lib/a.js': 'export const a = 1;\n',
        }),
      ]);

      await expect(verificarCargaEsm(raiz)).resolves.toMatchObject({ falhas: 1 });
    },
    PRAZO,
  );

  it(
    'resolve a dependencia interna pelo tarball do pacote irmao',
    async () => {
      const raiz = await criarRepo([
        biblioteca('@escopo/alfa', { 'dist/index.js': 'export const a = 1;\n' }),
        biblioteca(
          '@escopo/beta',
          { 'dist/index.js': "export { a } from '@escopo/alfa';\n" },
          { dependencies: { '@escopo/alfa': '1.0.0' } },
        ),
      ]);

      await expect(verificarCargaEsm(raiz)).resolves.toMatchObject({ falhas: 0 });
    },
    PRAZO,
  );

  it(
    'reprova quem depende de um pacote irmao que nao carrega — o caso do provider fs',
    async () => {
      const raiz = await criarRepo([
        biblioteca('@escopo/utils', {
          'dist/index.js': "export * from './string';\n",
          'dist/string.js': 'export const slugify = (texto) => texto;\n',
        }),
        biblioteca(
          '@escopo/provider',
          { 'dist/index.js': "export { slugify } from '@escopo/utils';\n" },
          { dependencies: { '@escopo/utils': '1.0.0' } },
        ),
      ]);

      const relatorio = await verificarCargaEsm(raiz);

      expect(relatorio.itens.map((item) => [item.pacote, item.tipo])).toEqual([
        ['@escopo/provider', 'falha'],
        ['@escopo/utils', 'falha'],
      ]);
    },
    PRAZO,
  );

  it(
    'liga a dependencia de terceiros instalada para o pacote no workspace, sem rede',
    async () => {
      const raiz = await criarRepo([
        biblioteca(
          '@escopo/alfa',
          {
            'dist/index.js': "export { externo } from 'dep-externa';\n",
            'node_modules/dep-externa/package.json': JSON.stringify({
              name: 'dep-externa',
              version: '1.0.0',
              type: 'module',
              main: 'index.js',
            }),
            'node_modules/dep-externa/index.js': 'export const externo = 1;\n',
          },
          { dependencies: { 'dep-externa': '^1.0.0' } },
        ),
      ]);

      await expect(verificarCargaEsm(raiz)).resolves.toMatchObject({ falhas: 0 });
    },
    PRAZO,
  );

  it(
    'roda cada bin com --version em vez de importar o CLI, que executaria o comando',
    async () => {
      const raiz = await criarRepo([
        {
          manifesto: { name: '@escopo/cli', type: 'module', bin: { 'meu-cli': 'bin/cli.js' }, files: ['bin'] },
          arquivos: { 'bin/cli.js': "process.exit(process.argv.includes('--version') ? 0 : 1);\n" },
        },
      ]);

      await expect(verificarCargaEsm(raiz)).resolves.toEqual({
        itens: [{ tipo: 'ok', pacote: '@escopo/cli', forma: { tipo: 'bin', bin: 'meu-cli' } }],
        falhas: 0,
      });
    },
    PRAZO,
  );

  it(
    'deixa de fora o pacote privado e o que esta no ignore do changesets',
    async () => {
      const quebrado = { 'dist/index.js': "export * from './falta';\n" };
      const raiz = await criarRepo(
        [
          biblioteca('@escopo/alfa', { 'dist/index.js': 'export const a = 1;\n' }),
          biblioteca('@escopo/interno', quebrado, { private: true }),
          biblioteca('@escopo/docs', quebrado),
        ],
        ['@escopo/docs'],
      );

      const relatorio = await verificarCargaEsm(raiz);

      expect(relatorio.itens.map((item) => item.pacote)).toEqual(['@escopo/alfa']);
    },
    PRAZO,
  );
});
