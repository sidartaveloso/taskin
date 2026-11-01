import type { SituationView } from '../use-cases/actors.types';
import { STATUS_REPORT_VERSION, type StatusReport } from './report.types';

export interface StatusTaskInput {
  readonly id: string;
  readonly title: string;
  readonly requires: readonly string[];
}

export interface StatusReportInput {
  readonly repository: string;
  readonly view: SituationView;
  readonly current: { readonly id: string; readonly title: string } | null;
  /** As tasks abertas, com o que cada uma pede no campo `Requires`. */
  readonly openTasks: readonly StatusTaskInput[];
}

/**
 * Monta o quadro uma vez, como dado. Uma task roda aqui quando alguma maquina
 * disponivel tem todas as capacidades que ela pede; as que faltam, na melhor
 * maquina, vao em `missing`.
 */
export function buildStatusReport(input: StatusReportInput): StatusReport {
  const { view } = input;
  const machines = view.resources.filter((r) => r.kind === 'machine');
  const accesses = view.resources.filter((r) => r.kind === 'access');
  const usable = machines
    .filter((m) => m.available)
    .map((m) => new Set(m.facts.filter((f) => !f.expired).map((f) => String(f.capability))));

  return {
    version: STATUS_REPORT_VERSION,
    repository: input.repository,
    observedAt: Number(view.observedAt),
    current: input.current,
    machines: machines.map((m) => ({
      name: m.name,
      layer: m.layer,
      available: m.available,
      ...(m.reason && { reason: m.reason.code }),
      capabilities: m.facts.filter((f) => !f.expired).map((f) => String(f.capability)),
    })),
    accesses: accesses.map((a) => ({
      name: a.name,
      layer: a.layer,
      available: a.available,
      ...(a.reason && { reason: a.reason.code }),
    })),
    tasks: input.openTasks.map((t) => {
      const missingByMachine = usable.map((caps) => t.requires.filter((r) => !caps.has(r)));
      const best = missingByMachine.reduce<string[] | undefined>(
        (acc, miss) => (acc === undefined || miss.length < acc.length ? miss : acc),
        undefined,
      );
      const missing = best ?? [...t.requires];
      return {
        id: t.id,
        title: t.title,
        requires: [...t.requires],
        runsHere: t.requires.length === 0 || missing.length === 0,
        missing,
      };
    }),
  };
}
