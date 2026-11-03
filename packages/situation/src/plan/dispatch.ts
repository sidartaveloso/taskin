import { z } from 'zod';
import type { Assignment, Plan } from '../system/plugins/scheduler/scheduler.types';
import { difficulty, type Instant, type ResourceId, type TaskRef, tokenCount } from '../use-cases/branded';
import type { RunOutcome } from '../use-cases/flows.types';
import type { IClockPort } from '../use-cases/ports.types';

/** Uma execucao que o despacho lancou e ainda nao terminou: ocupa uma vaga da maquina e uma da conta. */
export interface DispatchSlot {
  readonly task: TaskRef;
  readonly access: ResourceId;
  readonly machine: ResourceId;
}

export interface DispatchInput {
  /** A maquina que despacha: so as atribuicoes dela saem daqui. */
  readonly machine: ResourceId;
  readonly now: Instant;
  readonly running: readonly DispatchSlot[];
}

/**
 * O que o despacho faz com cada atribuicao do plano: `launch` sai agora, nesta
 * maquina; `remote` e de outra maquina e espera o despacho remoto; `later` e
 * desta maquina, mas ainda nao pode comecar (o momento, a vaga ou a
 * dependencia).
 */
export interface DispatchDecision {
  readonly launch: readonly Assignment[];
  readonly remote: readonly Assignment[];
  readonly later: readonly Assignment[];
}

/**
 * Decide o que sai agora. Pura: le o plano, o relogio e o que ja roda. Lanca
 * so as atribuicoes desta maquina com momento ate agora, sem dependencia
 * aberta, que nao estao rodando, sem passar da `concurrency` da maquina nem da
 * capacidade da conta, contando o que ja roda. O plano decide a ordem.
 */
export function decideDispatch(plan: Plan, input: DispatchInput): DispatchDecision {
  const { problem } = plan;
  const running = new Set(input.running.map((r) => r.task));
  const busy = (key: (s: DispatchSlot) => ResourceId, id: ResourceId) =>
    input.running.filter((r) => key(r) === id).length;
  const machine = problem.machines.find((m) => m.id === input.machine);
  let machineUsed = busy((s) => s.machine, input.machine);
  const accessUsed = new Map<ResourceId, number>();

  const launch: Assignment[] = [];
  const remote: Assignment[] = [];
  const later: Assignment[] = [];
  const ordered = [...plan.assignments].sort((a, b) => a.at - b.at);
  for (const a of ordered) {
    if (a.machine !== input.machine) {
      remote.push(a);
      continue;
    }
    if (running.has(a.task)) continue;
    const task = problem.tasks.find((t) => t.task === a.task);
    const access = problem.accesses.find((x) => x.id === a.access);
    const used = accessUsed.get(a.access) ?? busy((s) => s.access, a.access);
    const ready =
      a.at <= input.now &&
      (task?.dependsOn.length ?? 0) === 0 &&
      machineUsed < (machine?.concurrency ?? 1) &&
      (access?.concurrencyLimit === undefined || used < access.concurrencyLimit);
    if (!ready) {
      later.push(a);
      continue;
    }
    launch.push(a);
    machineUsed += 1;
    accessUsed.set(a.access, used + 1);
  }
  return { launch, remote, later };
}

export interface DispatchPorts {
  readonly clock: IClockPort;
  readonly machine: ResourceId;
  /**
   * Replaneja com o que esta aberto agora. `exclude` sao as tasks que o
   * despacho ja lancou: o plano nao as atribui, mas elas seguram quem depende delas.
   */
  plan(exclude: readonly TaskRef[]): Promise<Plan>;
  /** Lanca a atribuicao e resolve quando a execucao termina, bem ou mal. */
  launch(assignment: Assignment): Promise<void>;
  /** Abortado, o despacho nao lanca mais nada e so espera o que ja roda. */
  readonly signal?: AbortSignal;
}

export interface DispatchSummary {
  /** O que o despacho lancou, na ordem. */
  readonly launched: readonly Assignment[];
  /** As atribuicoes de outras maquinas no ultimo plano: esperam o despacho remoto. */
  readonly remote: readonly Assignment[];
}

/**
 * O laco do `taskin run`: planeja, lanca o que cabe agora nesta maquina, e,
 * cada vez que uma execucao termina, replaneja e lanca a proxima. Uma task sai
 * no maximo uma vez: a que termina sem fechar fica para quem a olhar. Acaba
 * quando nada roda e nada mais pode sair agora.
 */
export async function dispatchPlan(ports: DispatchPorts): Promise<DispatchSummary> {
  const launched: Assignment[] = [];
  const running = new Map<TaskRef, { readonly slot: DispatchSlot; readonly done: Promise<TaskRef> }>();
  let remote: readonly Assignment[] = [];

  for (;;) {
    if (!ports.signal?.aborted) {
      const plan = await ports.plan(launched.map((a) => a.task));
      const decision = decideDispatch(plan, {
        machine: ports.machine,
        now: ports.clock.now(),
        running: [...running.values()].map((r) => r.slot),
      });
      remote = decision.remote;
      for (const a of decision.launch) {
        launched.push(a);
        const done = ports.launch(a).then(
          () => a.task,
          () => a.task,
        );
        running.set(a.task, { slot: { task: a.task, access: a.access, machine: a.machine }, done });
      }
    }
    if (running.size === 0) break;
    running.delete(await Promise.race([...running.values()].map((r) => r.done)));
  }
  return { launched, remote };
}

/**
 * O que o comando escreve em `TASKIN_RUN_RESULT` ao terminar: a dificuldade
 * encontrada, os tokens, as iteracoes, se concluiu e se refez.
 */
export const runResultSchema = z.object({
  found: z.number().int().min(1).max(5),
  tokens: z.number().int().min(0),
  iterations: z.number().int().min(0),
  completed: z.boolean(),
  reworked: z.boolean(),
});

/**
 * O resultado da execucao pelo que o comando escreveu, com o modelo que o
 * plano escolheu. Sem texto, ou com um que nao diz tudo, nao ha resultado: a
 * execucao fecha como abandonada.
 */
export function runOutcomeFrom(text: string | undefined, model: string): RunOutcome | undefined {
  if (text === undefined) return undefined;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return undefined;
  }
  const parsed = runResultSchema.safeParse(json);
  if (!parsed.success) return undefined;
  const r = parsed.data;
  return {
    model,
    found: difficulty(r.found),
    tokens: tokenCount(r.tokens),
    iterations: r.iterations,
    completed: r.completed,
    reworked: r.reworked,
  };
}
