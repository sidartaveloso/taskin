import { readFile } from 'node:fs/promises';
import type { ManifestoDePacote } from './listador-de-pacotes.types';

export async function lerJson(caminho: string): Promise<unknown> {
  return JSON.parse(await readFile(caminho, 'utf8')) as unknown;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function extrairManifesto(valor: unknown): ManifestoDePacote | undefined {
  if (!ehObjeto(valor)) return undefined;
  const { name, private: privado } = valor;
  if (typeof name !== 'string' || name.length === 0) return undefined;
  return { nome: name, privado: privado === true };
}

export function extrairVersao(valor: unknown): string | undefined {
  if (!ehObjeto(valor)) return undefined;
  const { version } = valor;
  return typeof version === 'string' && version.length > 0 ? version : undefined;
}

export function extrairRepositoryUrl(valor: unknown): string | undefined {
  if (!ehObjeto(valor)) return undefined;
  const { repository } = valor;
  // `repository` aceita a forma abreviada em string ("github:x/y") alem do objeto.
  if (typeof repository === 'string') return repository.length > 0 ? repository : undefined;
  if (ehObjeto(repository) && typeof repository.url === 'string' && repository.url.length > 0) {
    return repository.url;
  }
  return undefined;
}

export function extrairIgnorados(valor: unknown): Set<string> {
  if (!ehObjeto(valor)) return new Set();
  const { ignore } = valor;
  if (!Array.isArray(ignore)) return new Set();
  return new Set(ignore.filter((item): item is string => typeof item === 'string'));
}

export function extrairRaizesDePublicacao(valor: unknown): string[] {
  if (!ehObjeto(valor) || !Array.isArray(valor.plugins)) return [];
  const raizes: string[] = [];
  for (const plugin of valor.plugins) {
    if (!Array.isArray(plugin) || plugin[0] !== '@semantic-release/npm') continue;
    const opcoes = plugin[1];
    if (ehObjeto(opcoes) && typeof opcoes.pkgRoot === 'string') raizes.push(opcoes.pkgRoot);
  }
  return raizes;
}
