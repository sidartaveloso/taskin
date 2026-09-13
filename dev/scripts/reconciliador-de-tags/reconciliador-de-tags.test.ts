import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import { lerPacotesPublicaveis, parsearTagsDoLsRemote, reconciliarTags, tagEsperada } from './reconciliador-de-tags';

const publicado = (versao: string): EstadoNoRegistry => ({ tipo: 'publicado', versao });
const ausente = (): EstadoNoRegistry => ({ tipo: 'ausente' });
const indeterminado = (motivo: string): EstadoNoRegistry => ({ tipo: 'indeterminado', motivo });

describe('tagEsperada', () => {
  it('compoe a tag do changesets como nome@versao', () => {
    expect(tagEsperada({ nome: '@opentask/taskin', versao: '4.0.0' })).toBe('@opentask/taskin@4.0.0');
  });
});

describe('parsearTagsDoLsRemote', () => {
  it('extrai os nomes das tags da saida do git ls-remote', () => {
    const saida = [
      'abc123\trefs/heads/main',
      'def456\trefs/tags/@opentask/taskin@3.0.3',
      'ghi789\trefs/tags/@opentask/taskin-types@2.0.0',
    ].join('\n');

    expect(parsearTagsDoLsRemote(saida)).toEqual(new Set(['@opentask/taskin@3.0.3', '@opentask/taskin-types@2.0.0']));
  });

  it('descarta o sufixo ^{} das tags anotadas', () => {
    const saida = ['def456\trefs/tags/@opentask/taskin@4.0.0', 'aaa111\trefs/tags/@opentask/taskin@4.0.0^{}'].join(
      '\n',
    );

    expect(parsearTagsDoLsRemote(saida)).toEqual(new Set(['@opentask/taskin@4.0.0']));
  });

  it('devolve conjunto vazio quando nao ha tag nenhuma', () => {
    expect(parsearTagsDoLsRemote('abc\trefs/heads/main\n')).toEqual(new Set());
  });
});

describe('reconciliarTags', () => {
  it('aprova quando toda versao publicada no npm tem tag no remoto', () => {
    const relatorio = reconciliarTags(
      [
        { nome: '@opentask/taskin', versao: '4.0.0' },
        { nome: '@opentask/taskin-types', versao: '2.0.0' },
      ],
      new Map([
        ['@opentask/taskin', publicado('4.0.0')],
        ['@opentask/taskin-types', publicado('2.0.0')],
      ]),
      new Set(['@opentask/taskin@4.0.0', '@opentask/taskin-types@2.0.0']),
    );

    expect(relatorio.dessincronizados).toBe(0);
    expect(relatorio.indeterminados).toBe(0);
    expect(relatorio.itens.every((item) => item.tipo === 'marcado')).toBe(true);
  });

  it('reprova a versao que saiu para o npm mas nao tem tag — o estado misto do release de 06/09', () => {
    const relatorio = reconciliarTags(
      [
        { nome: '@opentask/taskin-types', versao: '2.0.0' },
        { nome: '@opentask/ui-sense', versao: '0.2.0' },
      ],
      new Map([
        ['@opentask/taskin-types', publicado('2.0.0')],
        // ui-sense foi publicado mas o `changeset publish` nao empurrou a tag.
        ['@opentask/ui-sense', publicado('0.2.0')],
      ]),
      new Set(['@opentask/taskin-types@2.0.0']),
    );

    expect(relatorio.dessincronizados).toBe(1);
    expect(relatorio.itens).toContainEqual(
      expect.objectContaining({ tipo: 'sem-tag', pacote: '@opentask/ui-sense', tag: '@opentask/ui-sense@0.2.0' }),
    );
  });

  it('reprova quando a tag do remoto e de outra versao', () => {
    const relatorio = reconciliarTags(
      [{ nome: '@opentask/taskin', versao: '4.0.0' }],
      new Map([['@opentask/taskin', publicado('4.0.0')]]),
      // remoto parou em 3.0.3; o npm ja tem 4.0.0.
      new Set(['@opentask/taskin@3.0.3']),
    );

    expect(relatorio.dessincronizados).toBe(1);
    expect(relatorio.itens[0]).toMatchObject({ tipo: 'sem-tag', tag: '@opentask/taskin@4.0.0' });
  });

  it('nao exige tag de versao que ainda nao esta no npm — pacote novo nao vira falso positivo', () => {
    const relatorio = reconciliarTags(
      [{ nome: '@opentask/novo', versao: '0.1.0' }],
      // publish nunca chegou a esta versao (ou pacote recem-criado).
      new Map([['@opentask/novo', ausente()]]),
      new Set<string>(),
    );

    expect(relatorio.dessincronizados).toBe(0);
    expect(relatorio.indeterminados).toBe(0);
    expect(relatorio.itens[0]).toMatchObject({ tipo: 'nao-publicado', tag: '@opentask/novo@0.1.0' });
  });

  it('reprova quando nao deu para perguntar ao npm — verde as cegas e o que se quer evitar', () => {
    const relatorio = reconciliarTags(
      [{ nome: '@opentask/taskin', versao: '4.0.0' }],
      new Map([['@opentask/taskin', indeterminado('ETIMEDOUT')]]),
      new Set<string>(),
    );

    expect(relatorio.dessincronizados).toBe(0);
    expect(relatorio.indeterminados).toBe(1);
    expect(relatorio.itens[0]).toMatchObject({ tipo: 'indeterminado', motivo: 'ETIMEDOUT' });
  });

  it('trata pacote sem consulta ao registry como indeterminado, nunca como em dia', () => {
    const relatorio = reconciliarTags([{ nome: '@opentask/taskin', versao: '4.0.0' }], new Map(), new Set<string>());

    expect(relatorio.indeterminados).toBe(1);
    expect(relatorio.dessincronizados).toBe(0);
  });

  it('nao depende do output published da action: um release parcial que se diz verde ainda reprova', () => {
    // O caso de 06/09: types publicou e foi tagueado, ui-sense publicou sem tag,
    // taskin nem chegou a publicar. A action reportou o run como concluido —
    // a catraca decide pelo npm, nao por esse relatorio, e pega o buraco.
    const relatorio = reconciliarTags(
      [
        { nome: '@opentask/ui-sense', versao: '0.2.0' },
        { nome: '@opentask/taskin-types', versao: '2.0.0' },
        { nome: '@opentask/taskin', versao: '4.0.0' },
      ],
      new Map<string, EstadoNoRegistry>([
        ['@opentask/taskin-types', publicado('2.0.0')],
        ['@opentask/ui-sense', publicado('0.2.0')],
        ['@opentask/taskin', ausente()],
      ]),
      new Set(['@opentask/taskin-types@2.0.0']),
    );

    expect(relatorio.itens.map((item) => [item.pacote, item.tipo])).toEqual([
      ['@opentask/taskin', 'nao-publicado'],
      ['@opentask/taskin-types', 'marcado'],
      ['@opentask/ui-sense', 'sem-tag'],
    ]);
    expect(relatorio.dessincronizados).toBe(1);
  });

  it('aceita um iteravel de tags, nao so um Set', () => {
    const relatorio = reconciliarTags([{ nome: 'a', versao: '1.0.0' }], new Map([['a', publicado('1.0.0')]]), [
      'a@1.0.0',
    ]);
    expect(relatorio.dessincronizados).toBe(0);
  });
});

describe('lerPacotesPublicaveis', () => {
  const criados: string[] = [];

  afterAll(async () => {
    await Promise.all(criados.map((raiz) => rm(raiz, { recursive: true, force: true })));
  });

  async function criarRepo(
    pacotes: { nome: string; versao?: string; privado?: boolean }[],
    ignorados: string[] = [],
  ): Promise<string> {
    const raiz = await mkdtemp(join(tmpdir(), 'reconciliador-de-tags-'));
    criados.push(raiz);

    await mkdir(join(raiz, '.changeset'), { recursive: true });
    await writeFile(join(raiz, '.changeset', 'config.json'), JSON.stringify({ ignore: ignorados }));

    for (const [indice, pacote] of pacotes.entries()) {
      const pasta = join(raiz, 'packages', `pacote-${indice}`);
      await mkdir(pasta, { recursive: true });
      const manifesto: Record<string, unknown> = { name: pacote.nome };
      if (pacote.versao) manifesto.version = pacote.versao;
      if (pacote.privado) manifesto.private = true;
      await writeFile(join(pasta, 'package.json'), JSON.stringify(manifesto));
    }
    return raiz;
  }

  it('lista os pacotes publicaveis com sua versao, em ordem', async () => {
    const raiz = await criarRepo([
      { nome: '@escopo/beta', versao: '2.0.0' },
      { nome: '@escopo/alfa', versao: '1.0.0' },
    ]);

    expect(await lerPacotesPublicaveis(raiz)).toEqual([
      { nome: '@escopo/alfa', versao: '1.0.0' },
      { nome: '@escopo/beta', versao: '2.0.0' },
    ]);
  });

  it('ignora privados e os do ignore do changesets', async () => {
    const raiz = await criarRepo(
      [
        { nome: '@escopo/interno', versao: '1.0.0', privado: true },
        { nome: '@escopo/docs', versao: '1.0.0' },
        { nome: '@escopo/alfa', versao: '1.0.0' },
      ],
      ['@escopo/docs'],
    );

    expect(await lerPacotesPublicaveis(raiz)).toEqual([{ nome: '@escopo/alfa', versao: '1.0.0' }]);
  });

  it('descarta pacote sem version — nao ha o que reconciliar', async () => {
    const raiz = await criarRepo([{ nome: '@escopo/sem-versao' }, { nome: '@escopo/alfa', versao: '1.0.0' }]);

    expect(await lerPacotesPublicaveis(raiz)).toEqual([{ nome: '@escopo/alfa', versao: '1.0.0' }]);
  });
});
