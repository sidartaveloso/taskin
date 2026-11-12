export interface IDaemonService {
  readonly name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): ServiceState;
}

export interface IDaemonManager {
  register(service: IDaemonService): void;
  startAll(): Promise<ServiceReport[]>;
  stopAll(): Promise<void>;
  report(): ServiceReport[];
}

export interface IInstanceLock {
  acquire(): LockResult;
  release(): void;
}

export type ServiceState =
  | { readonly state: 'stopped' }
  | { readonly state: 'running' }
  | { readonly state: 'failed'; readonly reason: string };

export interface ServiceReport {
  readonly name: string;
  readonly status: ServiceState;
}

export type LockResult =
  | { readonly kind: 'acquired'; readonly reclaimedFromPid?: number }
  | { readonly kind: 'held'; readonly pid: number };

export interface DaemonSnapshot {
  readonly pid: number;
  readonly startedAt: string;
  readonly services: ServiceReport[];
}

export type DaemonStatus =
  | { readonly kind: 'not-running' }
  | { readonly kind: 'running'; readonly snapshot: DaemonSnapshot };

export type Platform = 'darwin' | 'linux';

export interface ServiceDefinition {
  readonly platform: Platform;
  readonly path: string;
  readonly content: string;
  readonly enable: readonly (readonly string[])[];
  readonly disable: readonly (readonly string[])[];
}

export type InstallTarget =
  | { readonly kind: 'supported'; readonly definition: ServiceDefinition }
  | { readonly kind: 'unsupported'; readonly platform: string };

export interface InstallEnvironment {
  readonly platform: string;
  readonly home: string;
  readonly execPath: string;
  readonly cliScript: string;
  readonly xdgConfigHome?: string;
}
