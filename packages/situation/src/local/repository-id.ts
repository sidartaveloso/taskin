/**
 * O id de um repositorio: o que chaveia as liberacoes da camada da pessoa e o
 * historico versionado. Vem de `resources.repository`, ou do remote `origin`
 * normalizado, e so em ultimo caso do nome da pasta. Vai a arquivo versionado,
 * entao um remote so serve quando nao diz nada da maquina nem traz credencial.
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

/**
 * O remote como `host/dono/nome`, igual para ssh e https, sem usuario, senha,
 * token, porta nem `.git`. Sem id para dar (caminho local, host sem dominio
 * publico, endereco IP), `undefined`: a URL levaria um dado da maquina ao
 * arquivo versionado.
 */
export function normalizeRemoteUrl(url: string): string | undefined {
  const remote = hostAndPath(url.trim());
  if (remote === undefined) return undefined;
  const host = remote.host.toLowerCase();
  if (!isPublicHost(host)) return undefined;
  const segments = remote.path
    .toLowerCase()
    .replace(/\.git\/*$/, '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0 || !segments.every((s) => SEGMENT.test(s))) return undefined;
  return [host, ...segments].join('/');
}

export interface RepositoryIdentitySources {
  /** O nome da pasta: o ultimo recurso. */
  readonly folder: string;
  /** `resources.repository` no `.taskin.json`, como veio. */
  readonly declared?: unknown;
  /** A URL do remote `origin`. */
  readonly remote?: string;
  /** Para onde a camada da pessoa libera recursos. */
  readonly releasedTo?: readonly string[];
}

export interface RepositoryIdentity {
  readonly id: string;
  /** Para quem roda o comando, em stderr. Nunca repetem a URL do remote. */
  readonly warnings: readonly string[];
}

/** O id deste repositorio e o que a pessoa precisa saber sobre ele. */
export function resolveRepositoryIdentity(sources: RepositoryIdentitySources): RepositoryIdentity {
  const { folder, declared, remote, releasedTo = [] } = sources;
  const warnings: string[] = [];
  const fromRemote = remote === undefined ? undefined : normalizeRemoteUrl(remote);

  let fromDeclared: string | undefined;
  if (typeof declared === 'string' && DECLARED.test(declared)) fromDeclared = declared;
  else if (declared !== undefined) {
    warnings.push(
      'resources.repository in .taskin.json must look like "owner/name" or "host/owner/name": ignoring it.',
    );
  }

  const id = fromDeclared ?? fromRemote ?? folder;
  if (fromDeclared !== undefined && fromRemote !== undefined && fromDeclared.toLowerCase() !== fromRemote) {
    warnings.push(
      `resources.repository declares "${fromDeclared}", but the origin remote is "${fromRemote}". Personal releases made to "${fromDeclared}" apply here: check that you trust this .taskin.json.`,
    );
  }
  if (fromDeclared === undefined && fromRemote === undefined) {
    warnings.push(
      `This repository has no id of its own: personal releases and the run history are tied to the folder name "${folder}". Declare resources.repository in .taskin.json, or add an origin remote with a public host.`,
    );
  }
  if (id !== folder && releasedTo.includes(folder)) {
    warnings.push(
      `Your personal resources release something to "${folder}", the name of this folder, which no longer counts: this repository is "${id}". To keep the release, replace it under releasedTo in ~/.config/taskin/resources.json.`,
    );
  }
  return { id, warnings };
}
