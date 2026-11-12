import { homedir } from 'node:os';
import { join } from 'node:path';
import { type LocalRunLedgerFiles, taskinStateDir } from '@opentask/taskin-situation';

/**
 * Os dois arquivos do registro de execucoes: o historico do time, versionado
 * em `.taskin/runs.jsonl` do repositorio, e o estado desta maquina
 * (`runs.jsonl` no diretorio de estado), que vale para todos os repositorios
 * dela e nunca vai ao repositorio.
 */
export function runLedgerFiles(root: string, env: NodeJS.ProcessEnv = process.env): LocalRunLedgerFiles {
  return {
    history: join(root, '.taskin', 'runs.jsonl'),
    machine: join(taskinStateDir(env, homedir()), 'runs.jsonl'),
  };
}
