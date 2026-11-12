import { expect } from 'vitest';
import { capability, durationMs, resourceId, taskRef, tokenCount } from '../../../use-cases/branded';
import { DOCKER } from '../../../use-cases/scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { FakePluginPorts } from '../../system.fake-ports';
import type { CalibrationTarget, CalibrationTask, IProbe, ProbeEvents } from './probe.types';

const NOTEBOOK = resourceId('notebook');
const DESKTOP = resourceId('desktop');
const CONTA_A = resourceId('conta-a');

const CALIBRATION: CalibrationTask = { task: taskRef('calibracao-soma'), expectedAnswer: '42' };

function sample(ports: FakePluginPorts, answer: string, latencyMs: number, tokens: number) {
  return {
    answer,
    latency: durationMs(latencyMs),
    tokens: tokenCount(tokens),
    buildTime: durationMs(30_000),
    testTime: durationMs(12_000),
    observedAt: ports.clock.now(),
  };
}

export const PROBE_CONTRACT_CASES: readonly PluginContractCase<IProbe>[] = [
  ...lifecycleCases<ProbeEvents, IProbe>(async (probe, ports) => {
    ports.probe.set(NOTEBOOK, { capabilities: [DOCKER], observedAt: ports.clock.now() });
    await probe.probe(NOTEBOOK);
    return 'probe:machine-probed';
  }, 'probe:machine-probed'),
  {
    name: 'a sondagem devolve o que a maquina tem, com a data em que foi visto',
    async run(probe, ports) {
      const facts = { capabilities: [DOCKER, capability('gpu')], observedAt: ports.clock.now() };
      ports.probe.set(NOTEBOOK, facts);

      expect(await probe.probe(NOTEBOOK)).toEqual({ state: 'probed', machine: NOTEBOOK, facts });
    },
  },
  {
    name: 'a maquina que nao responde volta inalcancavel, com o instante, e vira evento',
    async run(probe, ports) {
      await probe.start();
      const seen = recordEvents(probe, ['probe:machine-unreachable']);

      const report = await probe.probe(DESKTOP);

      expect(report).toEqual({ state: 'unreachable', machine: DESKTOP, observedAt: ports.clock.now() });
      expect(seen.map((e) => e.payload)).toEqual([{ machine: DESKTOP, observedAt: ports.clock.now() }]);
    },
  },
  {
    name: 'a calibracao roda a mesma task em todos os alvos e mede cada um',
    async run(probe, ports) {
      const targets: CalibrationTarget[] = [
        { machine: NOTEBOOK, access: CONTA_A },
        { machine: DESKTOP, access: CONTA_A },
      ];
      ports.calibration.set(targets[0]!, sample(ports, '42', 2_000, 400));
      ports.calibration.set(targets[1]!, sample(ports, '41', 4_000, 400));

      const report = await probe.calibrate(CALIBRATION, targets);

      expect(ports.calibration.calls).toEqual(targets);
      expect(report.task).toBe(CALIBRATION.task);
      expect(report.measurements).toEqual([
        expect.objectContaining({ state: 'measured', target: targets[0], correct: true, tokensPerSecond: 200 }),
        expect.objectContaining({ state: 'measured', target: targets[1], correct: false, tokensPerSecond: 100 }),
      ]);
    },
  },
  {
    name: 'um alvo que nao responde fica de fora da medida, sem parar os outros',
    async run(probe, ports) {
      const targets: CalibrationTarget[] = [
        { machine: DESKTOP, access: CONTA_A },
        { machine: NOTEBOOK, access: CONTA_A },
      ];
      ports.calibration.set(targets[1]!, sample(ports, '42', 1_000, 100));

      const report = await probe.calibrate(CALIBRATION, targets);

      expect(report.measurements.map((m) => m.state)).toEqual(['unreachable', 'measured']);
    },
  },
  {
    name: 'a calibracao avisa que comecou e que terminou, com as medidas',
    async run(probe, ports) {
      await probe.start();
      const seen = recordEvents(probe, ['probe:calibration-started', 'probe:calibration-finished']);
      const target = { machine: NOTEBOOK, access: CONTA_A };
      ports.calibration.set(target, sample(ports, '42', 1_000, 100));

      const report = await probe.calibrate(CALIBRATION, [target]);

      expect(seen.map((e) => e.type)).toEqual(['probe:calibration-started', 'probe:calibration-finished']);
      expect(seen[1]?.payload).toEqual({ calibration: report.id, measurements: report.measurements });
    },
  },
];

export function describeProbeContract(label: string, create: CreatePlugin<IProbe>): void {
  describeCases(label, create, PROBE_CONTRACT_CASES);
}
