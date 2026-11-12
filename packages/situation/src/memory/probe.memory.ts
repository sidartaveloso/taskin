import { pluginKey } from '../system/plugin.types';
import type {
  CalibrationId,
  CalibrationMeasurement,
  CalibrationReport,
  CalibrationTarget,
  CalibrationTask,
  IProbe,
  ProbeEvents,
  ProbePorts,
  ProbeReport,
} from '../system/plugins/probe/probe.types';
import type { ResourceId } from '../use-cases/branded';
import { MemoryPlugin } from './plugin.memory';

class MemoryProbe extends MemoryPlugin<ProbeEvents> implements IProbe {
  readonly key = pluginKey('probe');
  readonly name = 'Probe';
  readonly description = 'What each machine really has, and how each machine and access performs';

  private sequence = 0;

  constructor(private readonly ports: ProbePorts) {
    super(ports.clock);
  }

  async probe(machine: ResourceId): Promise<ProbeReport> {
    const facts = await this.ports.probe.probe(machine);
    if (facts === undefined) {
      const observedAt = this.clock.now();
      this.emit('probe:machine-unreachable', { machine, observedAt });
      return { state: 'unreachable', machine, observedAt };
    }
    this.emit('probe:machine-probed', { machine, facts });
    return { state: 'probed', machine, facts };
  }

  async calibrate(task: CalibrationTask, targets: readonly CalibrationTarget[]): Promise<CalibrationReport> {
    this.sequence += 1;
    const id = `calibration-${this.sequence}` as CalibrationId;
    const startedAt = this.clock.now();
    this.emit('probe:calibration-started', { calibration: id, task: task.task, targets });

    const measurements: CalibrationMeasurement[] = [];
    for (const target of targets) {
      const sample = await this.ports.calibration.run(target, task);
      if (sample === undefined) {
        measurements.push({ state: 'unreachable', target });
        continue;
      }
      const { answer, ...measured } = sample;
      measurements.push({
        state: 'measured',
        target,
        correct: answer === task.expectedAnswer,
        tokensPerSecond: sample.latency > 0 ? sample.tokens / (sample.latency / 1000) : 0,
        ...measured,
      });
    }

    this.emit('probe:calibration-finished', { calibration: id, measurements });
    return { id, task: task.task, startedAt, finishedAt: this.clock.now(), measurements };
  }
}

/** A sondagem em memoria: le a porta de sondagem e o executor de calibracao. */
export function createMemoryProbe(ports: ProbePorts): IProbe {
  return new MemoryProbe(ports);
}
