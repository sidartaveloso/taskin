import type { Brand, DurationMs, Instant, ResourceId, TaskRef, TokenCount } from '../../../use-cases/branded';
import type { ProbedFacts, SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * A sondagem e a calibracao: o que cada maquina tem de fato, e quanto cada
 * par maquina e acesso rende numa task de resposta conhecida.
 */
export interface IProbe extends IPluginSituation<ProbeEvents> {
  readonly key: PluginKey<'probe'>;
  probe(machine: ResourceId): Promise<ProbeReport>;
  /**
   * Roda a mesma task, em broadcast, em todos os alvos. Um alvo que nao
   * responde fica de fora da medida, sem parar os outros.
   */
  calibrate(task: CalibrationTask, targets: readonly CalibrationTarget[]): Promise<CalibrationReport>;
}

export type CalibrationId = Brand<string, 'CalibrationId'>;

export type ProbeReport =
  | { readonly state: 'probed'; readonly machine: ResourceId; readonly facts: ProbedFacts }
  | { readonly state: 'unreachable'; readonly machine: ResourceId; readonly observedAt: Instant };

/** Uma task pequena, de resposta conhecida. */
export interface CalibrationTask {
  readonly task: TaskRef;
  readonly expectedAnswer: string;
}

export interface CalibrationTarget {
  readonly machine: ResourceId;
  readonly access: ResourceId;
}

/** O que o executor de calibracao mediu num alvo. */
export interface CalibrationSample {
  readonly answer: string;
  readonly latency: DurationMs;
  readonly tokens: TokenCount;
  readonly buildTime: DurationMs;
  readonly testTime: DurationMs;
  readonly observedAt: Instant;
}

export type CalibrationMeasurement =
  | ({
      readonly state: 'measured';
      readonly target: CalibrationTarget;
      /** A resposta bateu com a esperada. */
      readonly correct: boolean;
      /** Tokens por segundo: `tokens / (latency / 1000)`. */
      readonly tokensPerSecond: number;
    } & Omit<CalibrationSample, 'answer'>)
  | { readonly state: 'unreachable'; readonly target: CalibrationTarget };

export interface CalibrationReport {
  readonly id: CalibrationId;
  readonly task: TaskRef;
  readonly startedAt: Instant;
  readonly finishedAt: Instant;
  /** Uma medida por alvo, na ordem dos alvos. */
  readonly measurements: readonly CalibrationMeasurement[];
}

export interface ICalibrationRunnerPort {
  /** Roda a task num alvo, ou `undefined` se o alvo nao respondeu. */
  run(target: CalibrationTarget, task: CalibrationTask): Promise<CalibrationSample | undefined>;
}

export type ProbePorts = Pick<SituationPorts, 'clock' | 'probe'> & { readonly calibration: ICalibrationRunnerPort };

export type ProbeEvents = {
  readonly 'probe:machine-probed': { readonly machine: ResourceId; readonly facts: ProbedFacts };
  readonly 'probe:machine-unreachable': { readonly machine: ResourceId; readonly observedAt: Instant };
  readonly 'probe:calibration-started': {
    readonly calibration: CalibrationId;
    readonly task: TaskRef;
    readonly targets: readonly CalibrationTarget[];
  };
  readonly 'probe:calibration-finished': {
    readonly calibration: CalibrationId;
    readonly measurements: readonly CalibrationMeasurement[];
  };
};
