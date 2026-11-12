import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Varias maquinas acrescentam linhas no fim do `.taskin/runs.jsonl`: sem isto,
 * todo merge conflita. A leitura aguenta o que a uniao pode deixar (linhas
 * repetidas ou fora de ordem).
 */
export const RUNS_MERGE_ATTRIBUTE = '.taskin/runs.jsonl merge=union';

/** Declara o atributo no `.gitattributes` de `dir`, sem repetir nem apagar. Diz se escreveu. */
export function ensureRunsMergeAttribute(dir: string): boolean {
  const file = join(dir, '.gitattributes');
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (current.split('\n').some((line) => line.trim() === RUNS_MERGE_ATTRIBUTE)) return false;
  const separator = current === '' || current.endsWith('\n') ? '' : '\n';
  writeFileSync(file, `${current}${separator}${RUNS_MERGE_ATTRIBUTE}\n`, 'utf-8');
  return true;
}
