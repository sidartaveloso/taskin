import type { IDaemonService, ServiceState } from './daemon.types.js';

export class DaemonServiceMock implements IDaemonService {
  private current: ServiceState = { state: 'stopped' };
  startCalls = 0;
  stopCalls = 0;

  constructor(
    readonly name: string,
    private readonly startFailure?: Error,
    private readonly log: string[] = [],
  ) {}

  async start(): Promise<void> {
    this.startCalls++;
    this.log.push(`start:${this.name}`);
    if (this.startFailure) throw this.startFailure;
    this.current = { state: 'running' };
  }

  async stop(): Promise<void> {
    this.stopCalls++;
    this.log.push(`stop:${this.name}`);
    this.current = { state: 'stopped' };
  }

  status(): ServiceState {
    return this.current;
  }
}
