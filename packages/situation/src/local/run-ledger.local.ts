import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createMemoryRunLedger } from '../memory/run-ledger.memory';
import type { IRunLedger, RunLedgerPorts } from '../system/plugins/run-ledger/run-ledger.types';
import type { Instant, RepositoryId, ResourceId, TaskRef, TokenCount } from '../use-cases/branded';
import { tokenCount } from '../use-cases/branded';
import type { RunFinished, RunOutcome, RunPlanned, RunStarted, ViewpointDelivered } from '../use-cases/flows.types';

/**
 * O registro em `.taskin/runs.jsonl`: uma linha por execucao fechada, so com
 * nomes logicos (o id do recurso, nunca endereco, hostname ou segredo).
 */
export function createLocalRunLedger(ports: RunLedgerPorts, runsFile: string): IRunLedger {
  const inner = createMemoryRunLedger(ports);

  const stored = (): RunFinished[] =>
    existsSync(runsFile)
      ? readFileSync(runsFile, 'utf8')
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => JSON.parse(line) as RunFinished)
      : [];

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
    startRun: (run: RunPlanned, access: ResourceId) => inner.startRun(run, access),
    async finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished> {
      const finished = await inner.finishRun(run, outcome);
      mkdirSync(dirname(runsFile), { recursive: true });
      appendFileSync(runsFile, `${JSON.stringify(finished)}\n`);
      return finished;
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
