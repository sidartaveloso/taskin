import { slugify } from '@opentask/taskin-utils';
import path from 'path';

/**
 * Maior trecho do titulo que entra no nome do arquivo da task, depois do
 * `task-NNN-`. O titulo completo continua no arquivo; o nome so precisa
 * identificar a task numa listagem de diretorio (task-139).
 *
 * @public
 */
export const TASK_FILE_SLUG_MAX_LENGTH = 50;

const PREFIXO = /^task-\d+-?/;

/**
 * O nome do arquivo de uma task: o numero, que e unico, e o comeco do titulo.
 * Titulo sem letra nem digito vira `task-NNN.md`, que o linter aceita.
 *
 * E a regra de quem cria (`createTask`) e de quem renomeia (`lint --fix`), para
 * um arquivo renomeado e um novo nunca divergirem (task-140).
 *
 * @public
 */
export function nomeDoArquivoDaTask(id: string, titulo: string): string {
  const trecho = slugify(titulo, { maxLength: TASK_FILE_SLUG_MAX_LENGTH });
  return trecho ? `task-${id}-${trecho}.md` : `task-${id}.md`;
}

/** O trecho do titulo no nome do arquivo, sem o `task-NNN-` e sem o `.md`. */
export function trechoDoTitulo(arquivo: string): string {
  return path.basename(arquivo).replace(/\.md$/, '').replace(PREFIXO, '');
}

/** O trecho do titulo no nome passa de {@link TASK_FILE_SLUG_MAX_LENGTH}. */
export function nomeLongoDemais(arquivo: string): boolean {
  return trechoDoTitulo(arquivo).length > TASK_FILE_SLUG_MAX_LENGTH;
}
