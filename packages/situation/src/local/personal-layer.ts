import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * As chaves do `resources.json` da pessoa que nao sao contas: o consentimento
 * para pontos de vista, os canais e os comandos de despacho aprovados. As
 * contas moram em chaves com o id da dona, cada uma uma lista; estas sao
 * objetos, por pessoa ou, no `dispatch`, por repositorio.
 */
export const PERSONAL_SECTIONS = ['viewpoints', 'channels', 'dispatch'] as const;
export type PersonalSection = (typeof PERSONAL_SECTIONS)[number];

export function readJsonFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, 'utf8');
  if (raw.trim() === '') return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Grava num temporario e renomeia por cima, so para a dona ler. */
export function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

/** Uma secao da camada da pessoa, por pessoa. Sem o arquivo ou sem a chave, vazia. */
export function readPersonalSection<T>(path: string, section: PersonalSection): Record<string, T> {
  const value = readJsonFile(path)[section];
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, T>) : {};
}

/** Regrava uma secao preservando o resto do arquivo: as contas e a outra secao. */
export function writePersonalSection(path: string, section: PersonalSection, value: Record<string, unknown>): void {
  writeJsonFile(path, { ...readJsonFile(path), [section]: value });
}
