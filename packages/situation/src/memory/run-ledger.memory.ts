import { pluginKey } from '../system/plugin.types';
import type { IRunLedger, RunLedgerEvents, RunLedgerPorts } from '../system/plugins/run-ledger/run-ledger.types';
import {
  type Difficulty,
  durationMs,
  type Instant,
  type RepositoryId,
  type ResourceId,
  runId,
  type TaskRef,
  type TokenCount,
  tokenCount,
} from '../use-cases/branded';
import type {
  OpenRun,
  RunAbandoned,
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunRecord,
  RunStarted,
  ViewpointDelivered,
} from '../use-cases/flows.types';
import { MemoryPlugin } from './plugin.memory';

/** O que o time sabe de uma execucao fechada: sem a conta e sem horario. */
export function toRunRecord(run: RunFinished): RunRecord {
  return {
    id: run.id,
    repository: run.repository,
    task: run.task,
    estimated: run.estimated,
    found: run.found,
    model: run.model,
    tokens: run.tokens,
    iterations: run.iterations,
    completed: run.completed,
    reworked: run.reworked,
    duration: run.duration,
  };
}

class MemoryRunLedger extends MemoryPlugin<RunLedgerEvents> implements IRunLedger {
  readonly key = pluginKey('run-ledger');
  readonly name = 'Run ledger';
  readonly description = 'Estimated and found difficulty, consumption, and the viewpoints of each run';

  private readonly open = new Map<string, OpenRun>();
  private readonly finished: RunFinished[] = [];
  private readonly recorded = new Map<string, ViewpointDelivered>();

  constructor(
    ports: RunLedgerPorts,
    private readonly newId: () => string,
  ) {
    super(ports.clock);
  }

  async planRun(repository: RepositoryId, task: TaskRef, estimated: Difficulty): Promise<RunPlanned> {
    const { state, ...fact }: RunPlanned = {
      state: 'planned',
      id: runId(this.newId()),
      repository,
      task,
      estimated,
      plannedAt: this.clock.now(),
    };
    this.emit('run-ledger:run-planned', fact);
    return { state, ...fact };
  }

  async startRun(run: RunPlanned, access: ResourceId): Promise<RunStarted> {
    const { state: _, ...planned } = run;
    const fact = { ...planned, access, startedAt: this.clock.now() };
    this.emit('run-ledger:run-started', fact);
    const started: RunStarted = { state: 'started', ...fact };
    this.open.set(started.id, { id: started.id, access: started.access, startedAt: started.startedAt });
    return started;
  }

  async finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished> {
    const { state: _, ...started } = run;
    const finishedAt = this.clock.now();
    const fact = { ...started, ...outcome, finishedAt, duration: durationMs(finishedAt - run.startedAt) };
    const finished: RunFinished = { state: 'finished', ...fact };
    this.open.delete(run.id);
    this.finished.push(finished);
    this.emit('run-ledger:run-finished', fact);
    return finished;
  }

  async abandonRun(run: RunStarted): Promise<RunAbandoned> {
    const { state: _, ...started } = run;
    const fact = { ...started, abandonedAt: this.clock.now() };
    this.open.delete(run.id);
    this.emit('run-ledger:run-abandoned', fact);
    return { state: 'abandoned', ...fact };
  }

  async openRuns(): Promise<readonly OpenRun[]> {
    return [...this.open.values()];
  }

  async runs(repository: RepositoryId): Promise<readonly RunRecord[]> {
    return this.finished.filter((r) => r.repository === repository).map(toRunRecord);
  }

  async consumption(access: ResourceId, since: Instant): Promise<TokenCount> {
    return tokenCount(
      this.finished.filter((r) => r.access === access && r.finishedAt >= since).reduce((sum, r) => sum + r.tokens, 0),
    );
  }

  /** Registrar o mesmo ponto de vista de novo nao faz nada: o sistema pode chegar a ele por dois caminhos. */
  async recordViewpoint(viewpoint: ViewpointDelivered): Promise<void> {
    if (this.recorded.has(viewpoint.id)) return;
    this.recorded.set(viewpoint.id, viewpoint);
    const { state: _, ...fact } = viewpoint;
    this.emit('run-ledger:viewpoint-recorded', fact);
  }

  async viewpoints(repository: RepositoryId, task: TaskRef): Promise<readonly ViewpointDelivered[]> {
    return [...this.recorded.values()].filter((v) => v.repository === repository && v.task === task);
  }
}

/**
 * O registro de execucao em memoria. So o relogio vem de fora. `newId` da o id
 * de cada execucao planejada; o padrao conta de 1 em 1, o que basta num
 * processo so.
 */
export function createMemoryRunLedger(ports: RunLedgerPorts, newId?: () => string): IRunLedger {
  let sequence = 0;
  return new MemoryRunLedger(ports, newId ?? (() => `run-${++sequence}`));
}
