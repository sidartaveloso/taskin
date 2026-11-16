import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { extrairIgnorados, extrairManifesto, extrairVersao, lerJson } from '../listador-de-pacotes/manifesto';
import type {
  BuscarPublicado,
  FormaDeCarga,
  ItemDeCarga,
  OpcoesDeCarga,
  OrigemDoPacote,
  RelatorioDeCarga,
} from './verificador-de-carga-esm.types';

const executar = promisify(execFile);

/** Tempo para um pacote carregar; um CLI que espera stdin nao segura o release. */
const PRAZO_DE_CARGA_MS = 30_000;

type Alvo = { nome: string; versao: string | undefined; pasta: string };

type Instalado = { alvo: Alvo; origem: OrigemDoPacote; pasta: string; manifesto: Record<string, unknown> };

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Mesmo recorte do changesets: nao privado e fora do `ignore`. */
async function listarAlvos(raizDoRepo: string): Promise<Alvo[]> {
  const config = await lerJson(join(raizDoRepo, '.changeset', 'config.json')).catch(() => undefined);
  const ignorados = extrairIgnorados(config);

  const pastas = await readdir(join(raizDoRepo, 'packages'), { withFileTypes: true });
  const alvos: Alvo[] = [];
  for (const pasta of pastas) {
    if (!pasta.isDirectory()) continue;
    const caminho = join(raizDoRepo, 'packages', pasta.name);
    const json = await lerJson(join(caminho, 'package.json')).catch(() => undefined);
    const manifesto = extrairManifesto(json);
    if (!manifesto || manifesto.privado || ignorados.has(manifesto.nome)) continue;
    alvos.push({ nome: manifesto.nome, versao: extrairVersao(json), pasta: caminho });
  }
  return alvos.sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * `pnpm pack` e o que o `changeset publish` manda para o registry: respeita o
 * `files` e troca `workspace:*` pela versao exata. Carregar o tarball, e nao a
 * pasta do workspace, e o que separa "funciona aqui" de "funciona publicado".
 */
async function empacotar(alvo: Alvo, destino: string): Promise<string> {
  try {
    const { stdout } = await executar('pnpm', ['pack', '--pack-destination', destino, '--json'], { cwd: alvo.pasta });
    const { filename } = JSON.parse(stdout.slice(stdout.indexOf('{'))) as { filename: string };
    return filename;
  } catch (erro) {
    throw new Error(`pnpm pack falhou em ${alvo.nome}: ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

/**
 * `npm pack nome@versao` baixa do registry o tarball como foi publicado. O npm
 * responde `E404` para o pacote que nao existe e `ETARGET` para a versao que
 * nao existe; qualquer outra falha (rede, credencial) nao e "nao publicado".
 */
export function versaoNaoPublicada(saidaDeErro: string): boolean {
  return /\b(E404|ETARGET)\b/.test(saidaDeErro);
}

/**
 * O que o `changeset publish` faz antes de publicar: pergunta ao registry se a
 * versao ja existe. Se existe, ele nao publica de novo — e e esse tarball, e nao
 * o local, que todo consumidor vai instalar.
 *
 * Falha fechado: sem conseguir perguntar ao registry, a verificacao nao tem
 * como saber de onde o pacote vem, e nao finge que sabe.
 */
export const buscarNoRegistry: BuscarPublicado = async ({ nome, versao }, destino) => {
  try {
    const { stdout } = await executar('npm', ['pack', `${nome}@${versao}`, '--pack-destination', destino, '--json']);
    const [{ filename }] = JSON.parse(stdout.slice(stdout.indexOf('['))) as [{ filename: string }];
    // O npm devolve `escopo-nome-1.0.0.tgz`; em versoes antigas, com a `/` do escopo.
    return join(destino, filename.replace(/^@/, '').replace('/', '-'));
  } catch (erro) {
    const { stderr, message } = erro as { stderr?: string; message?: string };
    if (versaoNaoPublicada(`${stderr ?? ''}${message ?? ''}`)) return undefined;
    throw new Error(
      `nao foi possivel consultar ${nome}@${versao} no registry: ${(stderr ?? message ?? String(erro)).trim().split('\n')[0]}`,
    );
  }
};

/**
 * Do registry, quando a versao ja esta publicada; do `pnpm pack` local, quando
 * nao esta ou quando ninguem perguntou ao registry.
 */
async function obterTarball(
  alvo: Alvo,
  destino: string,
  buscarPublicado: BuscarPublicado | undefined,
): Promise<{ tarball: string; origem: OrigemDoPacote }> {
  const publicado =
    buscarPublicado && alvo.versao
      ? await buscarPublicado({ nome: alvo.nome, versao: alvo.versao }, destino)
      : undefined;
  return publicado
    ? { tarball: publicado, origem: 'registry' }
    : { tarball: await empacotar(alvo, destino), origem: 'tarball_local' };
}

async function instalar(
  alvo: Alvo,
  { tarball, origem }: { tarball: string; origem: OrigemDoPacote },
  consumidor: string,
): Promise<Instalado> {
  const pasta = join(consumidor, 'node_modules', alvo.nome);
  await mkdir(pasta, { recursive: true });
  await executar('tar', ['-xzf', tarball, '-C', pasta, '--strip-components=1']);
  const manifesto = await lerJson(join(pasta, 'package.json'));
  return { alvo, origem, pasta, manifesto: ehObjeto(manifesto) ? manifesto : {} };
}

function dependenciasDeclaradas(manifesto: Record<string, unknown>): string[] {
  const nomes = new Set<string>();
  for (const campo of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    const mapa = manifesto[campo];
    if (ehObjeto(mapa)) for (const nome of Object.keys(mapa)) nomes.add(nome);
  }
  return [...nomes];
}

/**
 * Os pacotes do proprio repo resolvem pelos tarballs instalados lado a lado no
 * consumidor. As dependencias de terceiros vem do que o pnpm ja instalou para o
 * pacote no workspace, ligadas dentro dele: a verificacao nao depende de rede.
 * Uma dependencia que nao esta instalada em lugar nenhum fica sem ligacao, e a
 * carga acusa se o pacote precisar dela.
 */
async function ligarDependenciasExternas(instalado: Instalado, internos: Set<string>, raizDoRepo: string) {
  for (const dependencia of dependenciasDeclaradas(instalado.manifesto)) {
    if (internos.has(dependencia)) continue;
    const origem = [
      join(instalado.alvo.pasta, 'node_modules', dependencia),
      join(raizDoRepo, 'node_modules', dependencia),
    ].find((candidata) => existsSync(candidata));
    if (!origem) continue;

    const ligacao = join(instalado.pasta, 'node_modules', dependencia);
    await mkdir(dirname(ligacao), { recursive: true });
    await symlink(await realpath(origem), ligacao, 'dir');
  }
}

/** Importar um CLI executaria o comando; para ele, o que se carrega e cada bin. */
function formasDeCarga(instalado: Instalado): { forma: FormaDeCarga; argumentos: string[] }[] {
  const { bin } = instalado.manifesto;
  const nome = instalado.alvo.nome;
  const bins: [string, string][] =
    typeof bin === 'string'
      ? [[nome.replace(/^@[^/]+\//, ''), bin]]
      : ehObjeto(bin)
        ? Object.entries(bin).filter((par): par is [string, string] => typeof par[1] === 'string')
        : [];

  if (bins.length === 0) {
    return [
      { forma: { tipo: 'import' }, argumentos: ['--input-type=module', '-e', `await import(${JSON.stringify(nome)})`] },
    ];
  }
  return bins.map(([nomeDoBin, caminho]) => ({
    forma: { tipo: 'bin', bin: nomeDoBin },
    argumentos: [join(instalado.pasta, caminho), '--version'],
  }));
}

/**
 * A linha que diz o que quebrou — `Error [ERR_MODULE_NOT_FOUND]: Cannot find
 * module ...` —, com os caminhos relativos ao consumidor para caber no relatorio.
 * O Node imprime antes o trecho do proprio fonte (`throw new ERR_...(`), que
 * nao diz nada; por isso a busca e pela linha que comeca com o nome do erro.
 */
function resumirErro(erro: unknown, consumidor: string): string {
  const { stderr, killed, message } = erro as { stderr?: string; killed?: boolean; message?: string };
  if (killed) return `nao terminou em ${PRAZO_DE_CARGA_MS / 1000}s`;
  const linhas = (stderr ?? '').split('\n').map((linha) => linha.trim());
  const linha =
    linhas.find((candidata) => /^[A-Za-z]*Error\b/.test(candidata)) ??
    linhas.find((candidata) => candidata.length > 0) ??
    message ??
    String(erro);
  return linha.replaceAll(`${consumidor}/`, '');
}

async function carregar(instalado: Instalado, consumidor: string): Promise<ItemDeCarga[]> {
  return Promise.all(
    formasDeCarga(instalado).map(async ({ forma, argumentos }): Promise<ItemDeCarga> => {
      const pacote = instalado.alvo.nome;
      const { origem } = instalado;
      try {
        await executar(process.execPath, argumentos, { cwd: consumidor, timeout: PRAZO_DE_CARGA_MS });
        return { tipo: 'ok', pacote, origem, forma };
      } catch (erro) {
        return { tipo: 'falha', pacote, origem, forma, erro: resumirErro(erro, consumidor) };
      }
    }),
  );
}

/**
 * Carrega no Node ESM cada pacote publicavel, como ele sai para o registry.
 *
 * O `@opentask/taskin-utils@1.1.1` foi publicado com `export * from './security'`,
 * sem a extensao `.js`. O vitest e o `tsx` resolvem isso sozinhos, o loader ESM
 * do Node nao: `ERR_MODULE_NOT_FOUND`. O `@opentask/taskin-git-utils@3.1.0` saiu
 * igual, e o provider fs, que fixa os dois, nao carregava em consumidor nenhum.
 * Nenhum teste percebeu, porque todos rodam sobre o fonte ou sobre o workspace.
 *
 * Aqui cada pacote e empacotado com `pnpm pack`, os tarballs sao instalados
 * juntos num consumidor isolado, fora do workspace, e cada um e carregado pelo
 * nome, com `node --input-type=module -e "await import('<pacote>')"`, ou pelo
 * bin com `--version`. Exige os `dist` construidos.
 *
 * O `taskin@5.2.0` saiu importando `CAPABILITIES` de `@opentask/taskin-types` e
 * fixando a `2.7.0`, publicada antes de o nome existir: o fonte do pacote mudou
 * e a versao nao subiu. Com os tarballs locais lado a lado, a carga passava — o
 * `taskin-types` daqui tinha o export. Por isso, com `buscarPublicado`, o pacote
 * cuja versao ja esta no registry vem do registry: e o que o `changeset publish`
 * deixa la, e o que o consumidor instala.
 */
export async function verificarCargaEsm(raizDoRepo: string, opcoes: OpcoesDeCarga = {}): Promise<RelatorioDeCarga> {
  const alvos = await listarAlvos(raizDoRepo);
  const temporaria = await realpath(await mkdtemp(join(tmpdir(), 'carga-esm-')));
  try {
    const consumidor = join(temporaria, 'consumidor');
    await mkdir(join(consumidor, 'node_modules'), { recursive: true });
    await writeFile(join(consumidor, 'package.json'), JSON.stringify({ name: 'consumidor', private: true }));

    const internos = new Set(alvos.map((alvo) => alvo.nome));
    const instalados: Instalado[] = [];
    for (const alvo of alvos) {
      const instalado = await instalar(alvo, await obterTarball(alvo, temporaria, opcoes.buscarPublicado), consumidor);
      await ligarDependenciasExternas(instalado, internos, raizDoRepo);
      instalados.push(instalado);
    }

    const itens = (await Promise.all(instalados.map((instalado) => carregar(instalado, consumidor)))).flat();
    return {
      itens,
      falhas: itens.filter((item) => item.tipo === 'falha').length,
      doRegistry: instalados
        .filter((instalado) => instalado.origem === 'registry')
        .map((instalado) => `${instalado.alvo.nome}@${instalado.alvo.versao}`),
    };
  } finally {
    await rm(temporaria, { recursive: true, force: true });
  }
}
