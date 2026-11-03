import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createMemoryRunLedger } from '../memory/run-ledger.memory';
import type { IRunLedger, RunLedgerPorts } from '../system/plugins/run-ledger/run-ledger.types';
import type { Instant, RepositoryId, ResourceId, TaskRef, TokenCount } from '../use-cases/branded';
import { tokenCount } from '../use-cases/branded';
import type { RunFinished, RunOutcome, RunPlanned, RunStarted, ViewpointDelivered } from '../use-cases/flows.types';

/** Uma execucao que comecou ha mais que isto sem fechar e dada como abandonada: o processo morreu no meio. */
const OPEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface LocalRunLedgerOptions {
  /** Depois de quanto tempo uma execucao que comecou e nao fechou deixa de contar como em aberto. */
  readonly openMaxAgeMs?: number;
}

type Line = RunStarted | RunFinished;

/**
 * O registro em `.taskin/runs.jsonl`: uma linha quando a execucao comeca e
 * outra quando fecha, so com nomes logicos (o id do recurso, nunca endereco,
 * hostname ou segredo). Os ids sao unicos entre processos, para quem le o
 * arquivo casar o comeco com o fim; a execucao com comeco e sem fim e a que
 * esta em aberto.
 */
export function createLocalRunLedger(
  ports: RunLedgerPorts,
  runsFile: string,
  options: LocalRunLedgerOptions = {},
): IRunLedger {
  const openMaxAgeMs = options.openMaxAgeMs ?? OPEN_MAX_AGE_MS;
  const inner = createMemoryRunLedger(ports, () => `run-${randomUUID()}`);

  const lines = (): Line[] =>
    existsSync(runsFile)
      ? readFileSync(runsFile, 'utf8')
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => JSON.parse(line) as Line)
      : [];
  const stored = (): RunFinished[] => lines().filter((l): l is RunFinished => l.state === 'finished');
  const append = (line: Line) => {
    mkdirSync(dirname(runsFile), { recursive: true });
    appendFileSync(runsFile, `${JSON.stringify(line)}\n`);
  };

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
      append(started);
      return started;
    },
    async finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished> {
      const finished = await inner.finishRun(run, outcome);
      append(finished);
      return finished;
    },
    async openRuns(): Promise<readonly RunStarted[]> {
      const open = new Map<string, RunStarted>();
      for (const line of lines()) {
        if (line.state === 'started') open.set(line.id, line);
        else open.delete(line.id);
      }
      const now = ports.clock.now();
      return [...open.values()].filter((r) => now - r.startedAt <= openMaxAgeMs);
    },
    async runs(repository: RepositoryId): Promise<readonly RunFinished[]> {
      return stored().filter((r) => r.repository === repository);
    },
    async consumption(access: ResourceId, since: Instant): Promise<TokenCount> {
      return tokenCount(
        stored()
          .filter((r) => r.access === access && r.finishedAt >= since)
          .reduce((sum, r) => sum + r.tokens, 0),
      );
    },
    recordViewpoint: (viewpoint: ViewpointDelivered) => inner.recordViewpoint(viewpoint),
    viewpoints: (repository: RepositoryId, task: TaskRef) => inner.viewpoints(repository, task),
  };
}
