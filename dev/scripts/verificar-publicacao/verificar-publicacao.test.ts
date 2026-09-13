import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  extrairNomesDeTags,
  extrairRepositoryUrl,
  listarPacotesPublicaveis,
  pacotesSemRepositoryUrl,
  tagsFaltantes,
  tagsParaSincronizar,
} from './verificar-publicacao';
import type { PacotePublicavel } from './verificar-publicacao.types';

type PacoteDeTeste = {
  nome: string;
  versao?: string;
  privado?: boolean;
  repository?: unknown;
};

const criados: string[] = [];

async function criarRepo(pacotes: PacoteDeTeste[], ignorados: string[] = []): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), 'verificar-publicacao-'));
  criados.push(raiz);

  await mkdir(join(raiz, '.changeset'), { recursive: true });
  await writeFile(join(raiz, '.changeset', 'config.json'), JSON.stringify({ ignore: ignorados }));

  for (const [indice, pacote] of pacotes.entries()) {
    const pasta = join(raiz, 'packages', `pacote-${indice}`);
    await mkdir(pasta, { recursive: true });
    await writeFile(
      join(pasta, 'package.json'),
      JSON.stringify({
        name: pacote.nome,
        version: pacote.versao ?? '1.0.0',
        ...(pacote.privado ? { private: true } : {}),
        ...(pacote.repository !== undefined ? { repository: pacote.repository } : {}),
      }),
    );
  }
  return raiz;
}

afterAll(async () => {
  await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
});

describe('extrairRepositoryUrl', () => {
  it('le a forma de objeto com url', () => {
    expect(extrairRepositoryUrl({ repository: { url: 'git+https://github.com/x/y.git' } })).toBe(
      'git+https://github.com/x/y.git',
    );
  });

  it('le a forma de string curta', () => {
    expect(extrairRepositoryUrl({ repository: 'github:x/y' })).toBe('github:x/y');
  });

  it('devolve vazio quando o campo falta, e vazio, ou nao e texto', () => {
    expect(extrairRepositoryUrl({})).toBe('');
    expect(extrairRepositoryUrl({ repository: { url: '   ' } })).toBe('');
    expect(extrairRepositoryUrl({ repository: { url: 42 } })).toBe('');
    expect(extrairRepositoryUrl('nao-e-objeto')).toBe('');
  });
});

describe('listarPacotesPublicaveis', () => {
  it('devolve nome, versao e repository dos publicaveis, ordenados', async () => {
    const raiz = await criarRepo([
      { nome: '@escopo/zeta', versao: '2.0.0', repository: { url: 'git+https://github.com/x/y.git' } },
      { nome: '@escopo/alfa', versao: '1.2.3', repository: 'github:x/y' },
    ]);

    await expect(listarPacotesPublicaveis(raiz)).resolves.toEqual([
      { nome: '@escopo/alfa', versao: '1.2.3', repositoryUrl: 'github:x/y' },
      { nome: '@escopo/zeta', versao: '2.0.0', repositoryUrl: 'git+https://github.com/x/y.git' },
    ]);
  });

  it('omite privados e pacotes no ignore do changesets', async () => {
    const raiz = await criarRepo(
      [
        { nome: '@escopo/alfa', repository: 'github:x/y' },
        { nome: '@escopo/interno', privado: true },
        { nome: '@escopo/docs', repository: 'github:x/y' },
      ],
      ['@escopo/docs'],
    );

    const nomes = (await listarPacotesPublicaveis(raiz)).map((p) => p.nome);
    expect(nomes).toEqual(['@escopo/alfa']);
  });

  it('ignora package.json ilegivel em vez de derrubar a verificacao', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/alfa', repository: 'github:x/y' }]);
    const quebrado = join(raiz, 'packages', 'quebrado');
    await mkdir(quebrado, { recursive: true });
    await writeFile(join(quebrado, 'package.json'), '{ isto nao e json');

    const nomes = (await listarPacotesPublicaveis(raiz)).map((p) => p.nome);
    expect(nomes).toEqual(['@escopo/alfa']);
  });
});

describe('pacotesSemRepositoryUrl', () => {
  it('acusa exatamente os publicaveis sem repository.url', () => {
    const pacotes: PacotePublicavel[] = [
      { nome: '@escopo/alfa', versao: '1.0.0', repositoryUrl: 'git+https://github.com/x/y.git' },
      { nome: '@escopo/beta', versao: '1.0.0', repositoryUrl: '' },
      { nome: '@escopo/gama', versao: '1.0.0', repositoryUrl: '' },
    ];

    expect(pacotesSemRepositoryUrl(pacotes)).toEqual(['@escopo/beta', '@escopo/gama']);
  });

  it('devolve vazio quando todos declaram o campo', () => {
    const pacotes: PacotePublicavel[] = [{ nome: '@escopo/alfa', versao: '1.0.0', repositoryUrl: 'github:x/y' }];
    expect(pacotesSemRepositoryUrl(pacotes)).toEqual([]);
  });
});

describe('extrairNomesDeTags', () => {
  it('tira o prefixo refs/tags/ e junta a tag anotada com seu ^{}', () => {
    const saida = [
      'abc123\trefs/tags/taskin@4.0.0',
      'def456\trefs/tags/taskin@4.0.0^{}',
      '789aaa\trefs/tags/@opentask/ui-sense@0.2.0',
      '',
    ].join('\n');

    expect(extrairNomesDeTags(saida).sort()).toEqual(['@opentask/ui-sense@0.2.0', 'taskin@4.0.0']);
  });

  it('devolve vazio para saida vazia', () => {
    expect(extrairNomesDeTags('')).toEqual([]);
  });
});

describe('tagsFaltantes', () => {
  const pacotes: PacotePublicavel[] = [
    { nome: 'taskin', versao: '4.0.0', repositoryUrl: 'x' },
    { nome: '@opentask/ui-sense', versao: '0.2.0', repositoryUrl: 'x' },
  ];

  it('acusa a versao publicada que nao chegou como tag no remoto', () => {
    // Reproduz o 06/09: npm com versao nova, `git ls-remote --tags` sem ela.
    expect(tagsFaltantes(pacotes, ['taskin@3.0.3'])).toEqual(['taskin@4.0.0', '@opentask/ui-sense@0.2.0']);
  });

  it('nao acusa nada quando toda versao tem tag — retry idempotente fica verde', () => {
    expect(tagsFaltantes(pacotes, ['taskin@4.0.0', '@opentask/ui-sense@0.2.0'])).toEqual([]);
  });

  it('ignora pacote sem versao legivel', () => {
    expect(tagsFaltantes([{ nome: 'x', versao: '', repositoryUrl: 'x' }], [])).toEqual([]);
  });
});

describe('tagsParaSincronizar', () => {
  it('empurra so a tag faltante cuja versao esta de fato no npm', () => {
    // Retry do 06/09: as duas versoes estao no npm mas nenhuma virou tag.
    const faltantes = ['taskin@4.0.0', '@opentask/ui-sense@0.2.0'];
    const noNpm = ['taskin@4.0.0', '@opentask/ui-sense@0.2.0', 'taskin@3.0.3'];
    expect(tagsParaSincronizar(faltantes, noNpm)).toEqual(['taskin@4.0.0', '@opentask/ui-sense@0.2.0']);
  });

  it('nao marca versao que o npm nao tem — divergencia real fica para o verificar acusar', () => {
    const faltantes = ['taskin@4.0.0', '@opentask/ui-sense@0.2.0'];
    // O publish quebrou antes de mandar o ui-sense: so o taskin chegou ao npm.
    expect(tagsParaSincronizar(faltantes, ['taskin@4.0.0'])).toEqual(['taskin@4.0.0']);
  });

  it('devolve vazio quando nada falta', () => {
    expect(tagsParaSincronizar([], ['taskin@4.0.0'])).toEqual([]);
  });
});
