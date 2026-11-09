/**
 * Um repositorio tem dois ids, porque fazem trabalhos diferentes.
 *
 * O do historico nomeia as linhas do `.taskin/runs.jsonl`, e vai a arquivo
 * versionado: vem de `resources.repository` ou do remote `origin`, e so serve
 * um remote que nao diz nada da maquina. Falsifica-lo so rotula o proprio arquivo.
 *
 * O de confianca decide o que a pessoa liberou e aprovou para este repositorio,
 * e fica so na camada dela. Quem escreve o `.taskin.json` escolhe o que ele diz,
 * entao ele nunca vem de la: vem do `origin`, que o clone nao traz do arquivo,
 * ou do caminho da pasta.
 */

const REMOTE_SCHEMES = new Set(['ssh:', 'git+ssh:', 'git:', 'http:', 'https:']);
/** Sufixos de rede que nao sao publicos: o nome da maquina nao vai ao repositorio. */
const PRIVATE_SUFFIXES = ['.local', '.localhost', '.lan', '.home', '.internal', '.intranet', '.corp', '.ts.net'];
const SEGMENT = /^[a-z0-9._~-]+$/;
const DECLARED = /^[A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*$/;

function hostAndPath(url: string): { host: string; path: string } | undefined {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return REMOTE_SCHEMES.has(parsed.protocol) ? { host: parsed.hostname, path: parsed.pathname } : undefined;
    } catch {
      return undefined;
    }
  }
  // A forma do scp: `git@host:dono/nome.git`. O caminho nao comeca com barra.
  const scp = /^(?:[^@/\s]+@)?([^/:\s]+):(?!\/)([^\s]+)$/.exec(url);
  return scp ? { host: scp[1] as string, path: (scp[2] as string).replace(/[?#].*$/, '') } : undefined;
}

function isPublicHost(host: string): boolean {
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return false;
  if (/^\d+(\.\d+)+$/.test(host)) return false;
  return !PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** O remote como host e caminho normalizados, sem usuario, senha, token, porta nem `.git`. */
function remoteParts(url: string): { host: string; key: string } | undefined {
  const remote = hostAndPath(url.trim());
  if (remote === undefined) return undefined;
  const host = remote.host.toLowerCase();
  if (!/^[a-z0-9.:[\]-]+$/.test(host)) return undefined;
  const segments = remote.path
    .toLowerCase()
    .replace(/\.git\/*$/, '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0 || !segments.every((s) => SEGMENT.test(s))) return undefined;
  return { host, key: [host, ...segments].join('/') };
}

/**
 * O remote como `host/dono/nome`, igual para ssh e https, para ir ao arquivo
 * versionado. Sem id para dar (caminho local, host sem dominio publico,
 * endereco IP), `undefined`: a URL levaria um dado da maquina ao repositorio.
 */
export function normalizeRemoteUrl(url: string): string | undefined {
  const parts = remoteParts(url);
  return parts !== undefined && isPublicHost(parts.host) ? parts.key : undefined;
}

export interface RepositoryIdentitySources {
  /** O nome da pasta: o ultimo recurso do id do historico. */
  readonly folder: string;
  /** O caminho completo da pasta: o ultimo recurso do id de confianca. */
  readonly location: string;
  /** `resources.repository` no `.taskin.json`, como veio. */
  readonly declared?: unknown;
  /** A URL do remote `origin`. */
  readonly remote?: string;
  /** Para onde a camada da pessoa libera recursos. */
  readonly releasedTo?: readonly string[];
}

export interface RepositoryIdentity {
  /** O id do historico: vai ao `.taskin/runs.jsonl`, versionado. */
  readonly id: string;
  /** O id de confianca: chaveia `releasedTo` e as aprovacoes, e fica so na camada da pessoa. */
  readonly trustId: string;
  /** Para quem roda o comando, em stderr. Nunca repetem a URL do remote. */
  readonly warnings: readonly string[];
}

/** Os dois ids deste repositorio e o que a pessoa precisa saber sobre eles. */
export function resolveRepositoryIdentity(sources: RepositoryIdentitySources): RepositoryIdentity {
  const { folder, location, declared, remote, releasedTo = [] } = sources;
  const warnings: string[] = [];
  const fromRemote = remote === undefined ? undefined : normalizeRemoteUrl(remote);
  const trustFromRemote = remote === undefined ? undefined : remoteParts(remote)?.key;

  let fromDeclared: string | undefined;
  if (typeof declared === 'string' && DECLARED.test(declared)) fromDeclared = declared;
  else if (declared !== undefined) {
    warnings.push(
      'resources.repository in .taskin.json must look like "owner/name" or "host/owner/name": ignoring it.',
    );
  }

  const id = fromDeclared ?? fromRemote ?? folder;
  const trustId = trustFromRemote ?? `path:${location}`;

  if (fromDeclared === undefined && fromRemote === undefined) {
    warnings.push(
      `The run history of this repository is tied to the folder name "${folder}": declare resources.repository in .taskin.json, or add an origin remote with a public host.`,
    );
  }
  for (const stale of new Set([folder, ...(fromDeclared === undefined ? [] : [fromDeclared])])) {
    if (stale === trustId || !releasedTo.includes(stale)) continue;
    warnings.push(
      `Your personal resources release something to "${stale}", which no longer counts: what you trust here is "${trustId}". To keep the release, replace it under releasedTo in ~/.config/taskin/resources.json.`,
    );
  }
  return { id, trustId, warnings };
}
