import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extrairIgnorados, lerJson } from '../listador-de-pacotes/manifesto';
import type { PacotePublicavel } from './verificar-publicacao.types';

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/**
 * O `repository` do npm aceita duas formas: a string curta ou o objeto com
 * `url`. A proveniencia do sigstore le a URL nas duas, entao o guarda-corpo
 * tambem precisa.
 */
export function extrairRepositoryUrl(valor: unknown): string {
  if (!ehObjeto(valor)) return '';
  const { repository } = valor;
  if (typeof repository === 'string') return repository.trim();
  if (ehObjeto(repository) && typeof repository.url === 'string') return repository.url.trim();
  return '';
}

function extrairPacotePublicavel(valor: unknown): PacotePublicavel | undefined {
  if (!ehObjeto(valor)) return undefined;
  const { name, version, private: privado } = valor;
  if (typeof name !== 'string' || name.length === 0) return undefined;
  if (privado === true) return undefined;
  return {
    nome: name,
    versao: typeof version === 'string' ? version : '',
    repositoryUrl: extrairRepositoryUrl(valor),
  };
}

/**
 * Percorre `packages/*` aplicando o mesmo recorte do changesets (nao privado e
 * fora do `ignore`) e devolve os manifestos publicaveis, ordenados. Reusa o
 * mesmo leitor tolerante do listador: um package.json ilegivel e ignorado em
 * vez de derrubar a verificacao.
 */
export async function listarPacotesPublicaveis(raizDoRepo: string): Promise<PacotePublicavel[]> {
  const config = await lerJson(join(raizDoRepo, '.changeset', 'config.json')).catch(() => undefined);
  const ignorados = extrairIgnorados(config);

  const pastas = await readdir(join(raizDoRepo, 'packages'), { withFileTypes: true });
  const pacotes: PacotePublicavel[] = [];
  for (const pasta of pastas) {
    if (!pasta.isDirectory()) continue;
    const pacote = extrairPacotePublicavel(
      await lerJson(join(raizDoRepo, 'packages', pasta.name, 'package.json')).catch(() => undefined),
    );
    if (!pacote || ignorados.has(pacote.nome)) continue;
    pacotes.push(pacote);
  }
  return pacotes.sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Nomes dos pacotes publicaveis sem `repository.url`. Foi exatamente este campo
 * vazio que fez o `changeset publish` abortar no meio (E422 do npm) e partir o
 * release do 06/09 em duas passadas. Rodar isto ANTES do publish recusa o
 * release inteiro em vez de deixar metade dos pacotes no npm.
 */
export function pacotesSemRepositoryUrl(pacotes: PacotePublicavel[]): string[] {
  return pacotes.filter((p) => p.repositoryUrl === '').map((p) => p.nome);
}

/**
 * Extrai os nomes das tags da saida de `git ls-remote --tags`. Cada linha vem
 * como `<sha>\trefs/tags/<nome>`; tags anotadas ainda repetem a linha com o
 * sufixo `^{}` (o objeto derreferenciado), que aqui vira o mesmo nome.
 */
export function extrairNomesDeTags(saidaGitLsRemote: string): string[] {
  const nomes = new Set<string>();
  for (const linha of saidaGitLsRemote.split('\n')) {
    const ref = linha.split('\t')[1];
    if (!ref?.startsWith('refs/tags/')) continue;
    nomes.add(ref.slice('refs/tags/'.length).replace(/\^\{\}$/, ''));
  }
  return [...nomes];
}

/**
 * `nome@versao` de cada pacote publicavel cuja versao atual nao tem tag no
 * remoto. A tag do changesets tem esse mesmo formato. Rodar isto DEPOIS do
 * publish transforma o estado dessincronizado — npm com versao nova, remoto sem
 * tag — em falha vermelha, em vez do verde enganoso do release do 06/09. Como a
 * marca deriva do que esta publicado, um retry que empurre as tags que faltam
 * zera a divergencia: o guarda-corpo e idempotente.
 */
export function tagsFaltantes(pacotes: PacotePublicavel[], tagsExistentes: readonly string[]): string[] {
  const existentes = new Set(tagsExistentes);
  return pacotes
    .filter((p) => p.versao !== '')
    .map((p) => `${p.nome}@${p.versao}`)
    .filter((tag) => !existentes.has(tag));
}

/**
 * Das tags que faltam no remoto, aquelas cuja versao esta de fato publicada no
 * npm. A marca deriva do registry, nao do que a passada atual conseguiu
 * publicar: uma versao que chegou ao npm mas ficou sem tag entra aqui para ser
 * empurrada; uma que nunca foi publicada fica de fora e continua acusada pelo
 * `verificar:tags-de-publicacao`. Rodar isto no retry completa um release
 * parcial sem intervencao manual, e sem nunca marcar um commit que o npm nao
 * tem.
 */
export function tagsParaSincronizar(faltantes: readonly string[], publicadasNoNpm: readonly string[]): string[] {
  const noNpm = new Set(publicadasNoNpm);
  return faltantes.filter((tag) => noNpm.has(tag));
}
