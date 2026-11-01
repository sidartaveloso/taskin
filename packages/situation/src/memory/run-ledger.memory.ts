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
import type { RunFinished, RunOutcome, RunPlanned, RunStarted, ViewpointDelivered } from '../use-cases/flows.types';
import { MemoryPlugin } from './plugin.memory';

class MemoryRunLedger extends MemoryPlugin<RunLedgerEvents> implements IRunLedger {
  readonly key = pluginKey('run-ledger');
  readonly name = 'Run ledger';
  readonly description = 'Estimated and found difficulty, consumption, and the viewpoints of each run';

  private sequence = 0;
  private readonly finished: RunFinished[] = [];
  private readonly recorded = new Map<string, ViewpointDelivered>();

  constructor(ports: RunLedgerPorts) {
    super(ports.clock);
  }

  async planRun(repository: RepositoryId, task: TaskRef, estimated: Difficulty): Promise<RunPlanned> {
    this.sequence += 1;
    const { state, ...fact }: RunPlanned = {
      state: 'planned',
      id: runId(`run-${this.sequence}`),
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
    return { state: 'started', ...fact };
  }

  async finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished> {
    const { state: _, ...started } = run;
    const finishedAt = this.clock.now();
    const fact = { ...started, ...outcome, finishedAt, duration: durationMs(finishedAt - run.startedAt) };
    const finished: RunFinished = { state: 'finished', ...fact };
    this.finished.push(finished);
    this.emit('run-ledger:run-finished', fact);
    return finished;
  }

  async runs(repository: RepositoryId): Promise<readonly RunFinished[]> {
    return this.finished.filter((r) => r.repository === repository);
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

/** O registro de execucao em memoria. So o relogio vem de fora. */
export function createMemoryRunLedger(ports: RunLedgerPorts): IRunLedger {
  return new MemoryRunLedger(ports);
}
