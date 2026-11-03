import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createMemoryRunLedger, toRunRecord } from '../memory/run-ledger.memory';
import type { IRunLedger, RunLedgerPorts } from '../system/plugins/run-ledger/run-ledger.types';
import type { Instant, RepositoryId, ResourceId, RunId, TaskRef, TokenCount } from '../use-cases/branded';
import { tokenCount } from '../use-cases/branded';
import type {
  OpenRun,
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunRecord,
  RunStarted,
  ViewpointDelivered,
} from '../use-cases/flows.types';

/** Uma execucao que comecou ha mais que isto sem fechar e dada como abandonada: o processo morreu no meio. */
const OPEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Os dois arquivos do registro: o que e do time e o que e so desta maquina. */
export interface LocalRunLedgerFiles {
  /**
   * `.taskin/runs.jsonl`, versionado: uma linha por execucao fechada, so com o
   * que calibra (o `RunRecord`). Nada que identifique a conta, nenhum horario.
   */
  readonly history: string;
  /**
   * `runs.jsonl` no diretorio de estado da maquina, valendo para todos os
   * repositorios dela: qual conta cada execucao usou, quando comecou e quanto
   * gastou, com o horario. Nunca vai ao repositorio.
   */
  readonly machine: string;
}

export interface LocalRunLedgerOptions {
  /** Depois de quanto tempo uma execucao que comecou e nao fechou deixa de contar como em aberto. */
  readonly openMaxAgeMs?: number;
}

interface StartedLine {
  readonly state: 'started';
  readonly id: RunId;
  readonly access: ResourceId;
  readonly startedAt: Instant;
}

interface FinishedLine {
  readonly state: 'finished';
  readonly id: RunId;
  readonly access: ResourceId;
  readonly tokens: TokenCount;
  readonly finishedAt: Instant;
}

type MachineLine = StartedLine | FinishedLine;

function readLines<T>(file: string): T[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as T);
}

function append(file: string, line: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(line)}\n`, { mode: 0o600 });
}

/**
 * O registro em dois arquivos. O historico do time e versionado, e por isso
 * so leva o `RunRecord`: a conta da camada da pessoa tem o nome que a pessoa
 * escolheu, e os horarios dizem quando ela trabalha. O estado da maquina
 * guarda o resto: o comeco de cada execucao (a que tem comeco e nao tem fim
 * esta em aberto) e o consumo de cada conta, com o horario. Os ids sao unicos
 * entre processos, para quem le o arquivo casar o comeco com o fim.
 */
export function createLocalRunLedger(
  ports: RunLedgerPorts,
  files: LocalRunLedgerFiles,
  options: LocalRunLedgerOptions = {},
): IRunLedger {
  const openMaxAgeMs = options.openMaxAgeMs ?? OPEN_MAX_AGE_MS;
  const inner = createMemoryRunLedger(ports, () => `run-${randomUUID()}`);

  return {
    get key() {
      return inner.key;
    },
    get name() {
      return inner.name;
    },
    get description() {
      return inner.description;
    },
    get version() {
      return inner.version;
    },
    get running() {
      return inner.running;
    },
    start: () => inner.start(),
    stop: () => inner.stop(),
    on: (type, handler) => inner.on(type, handler),
    off: (type, handler) => inner.off(type, handler),
    planRun: (repository, task, estimated) => inner.planRun(repository, task, estimated),
    async startRun(run: RunPlanned, access: ResourceId): Promise<RunStarted> {
      const started = await inner.startRun(run, access);
      const line: StartedLine = { state: 'started', id: started.id, access, startedAt: started.startedAt };
      append(files.machine, line);
      return started;
    },
    async finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished> {
      const finished = await inner.finishRun(run, outcome);
      append(files.history, toRunRecord(finished));
      const line: FinishedLine = {
        state: 'finished',
        id: finished.id,
        access: finished.access,
        tokens: finished.tokens,
        finishedAt: finished.finishedAt,
      };
      append(files.machine, line);
      return finished;
    },
    async openRuns(): Promise<readonly OpenRun[]> {
      const open = new Map<string, OpenRun>();
      for (const line of readLines<MachineLine>(files.machine)) {
        if (line.state === 'started')
          open.set(line.id, { id: line.id, access: line.access, startedAt: line.startedAt });
        else open.delete(line.id);
      }
      const now = ports.clock.now();
      return [...open.values()].filter((r) => now - r.startedAt <= openMaxAgeMs);
    },
    async runs(repository: RepositoryId): Promise<readonly RunRecord[]> {
      return readLines<RunRecord>(files.history).filter((r) => r.repository === repository);
    },
    async consumption(access: ResourceId, since: Instant): Promise<TokenCount> {
      return tokenCount(
        readLines<MachineLine>(files.machine)
          .filter((l): l is FinishedLine => l.state === 'finished' && l.access === access && l.finishedAt >= since)
          .reduce((sum, l) => sum + l.tokens, 0),
      );
    },
    recordViewpoint: (viewpoint: ViewpointDelivered) => inner.recordViewpoint(viewpoint),
    viewpoints: (repository: RepositoryId, task: TaskRef) => inner.viewpoints(repository, task),
  };
}
