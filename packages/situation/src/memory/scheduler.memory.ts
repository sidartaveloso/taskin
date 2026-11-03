import { pluginKey } from '../system/plugin.types';
import type {
  Assignment,
  ConstraintCode,
  ConstraintViolation,
  DeferredTask,
  IScheduler,
  ObjectiveWeights,
  Plan,
  PlanScore,
  SchedulerEvents,
  SchedulingAccess,
  SchedulingMachine,
  SchedulingModel,
  SchedulingProblem,
  SchedulingTask,
  SuggestedPlan,
} from '../system/plugins/scheduler/scheduler.types';
import { covers, type Instant, instant, type TaskRef } from '../use-cases/branded';
import type { IClockPort } from '../use-cases/ports.types';
import { MemoryPlugin } from './plugin.memory';

const HOUR = 60 * 60 * 1000;

/** Uma atribuicao com o que ela cita, ja achado no problema. */
interface Resolved {
  readonly assignment: Assignment;
  readonly task: SchedulingTask;
  readonly access: SchedulingAccess;
  readonly model: SchedulingModel;
  readonly machine: SchedulingMachine;
}

/**
 * Acha no problema o que cada atribuicao cita. O que o problema nao tem, e a
 * segunda atribuicao de uma mesma task, ficam de fora e voltam como `unknown`.
 */
function resolve(plan: Plan): { readonly resolved: Resolved[]; readonly unknown: Assignment[] } {
  const { problem } = plan;
  const resolved: Resolved[] = [];
  const unknown: Assignment[] = [];
  const seen = new Set<TaskRef>();
  for (const assignment of plan.assignments) {
    const task = problem.tasks.find((t) => t.task === assignment.task);
    const access = problem.accesses.find((a) => a.id === assignment.access);
    const model = access?.models.find((m) => m.name === assignment.model);
    const machine = problem.machines.find((m) => m.id === assignment.machine);
    if (
      task === undefined ||
      access === undefined ||
      model === undefined ||
      machine === undefined ||
      seen.has(assignment.task)
    ) {
      unknown.push(assignment);
      continue;
    }
    seen.add(assignment.task);
    resolved.push({ assignment, task, access, model, machine });
  }
  return { resolved, unknown };
}

/** A funcao objetivo, pura: so le o plano e os pesos. */
export function scorePlan(plan: Plan, weights: ObjectiveWeights): PlanScore {
  const { resolved } = resolve(plan);
  let value = 0;
  let money = 0;
  let rework = 0;
  const setupPaid = new Map<string, number>();
  const interrupted = new Map<number, Set<string>>();

  for (const { assignment, task, model, machine } of resolved) {
    value += task.value * model.completionRate;
    money += (task.estimatedTokens / 1000) * model.costPerThousandTokens;
    rework += task.value * (1 - model.completionRate);
    for (const requirement of task.requirements) {
      if (requirement.mobility !== 'movable' || machine.capabilities.includes(requirement.capability)) continue;
      const pair = `${machine.id}\u0000${requirement.capability}`;
      if (!setupPaid.has(pair)) setupPaid.set(pair, requirement.setupCost);
    }
    const people = interrupted.get(assignment.at) ?? new Set();
    for (const person of task.interruptions) people.add(person);
    interrupted.set(assignment.at, people);
  }

  const setup = [...setupPaid.values()].reduce((sum, cost) => sum + cost, 0);
  const interruptions = [...interrupted.values()].reduce((sum, people) => sum + people.size, 0);
  return {
    total:
      value -
      weights.money * money -
      weights.setup * setup -
      weights.rework * rework -
      weights.interruptions * interruptions,
    terms: { value, money, setup, rework, interruptions },
  };
}

/** As restricoes que o plano fere, na ordem de `CONSTRAINT_CODES`. */
export function violations(plan: Plan): readonly ConstraintViolation[] {
  const { problem } = plan;
  const { resolved, unknown } = resolve(plan);
  const found: ConstraintViolation[] = [];
  const add = (code: ConstraintCode, tasks: readonly TaskRef[], detail: string) => found.push({ code, tasks, detail });

  const byAccess = new Map<SchedulingAccess, Resolved[]>();
  for (const r of resolved) byAccess.set(r.access, [...(byAccess.get(r.access) ?? []), r]);
  for (const [access, list] of byAccess) {
    const tokens = list.reduce((sum, r) => sum + r.task.estimatedTokens, 0);
    const budget = access.remaining * (1 - problem.quotaMargin);
    if (tokens > budget) {
      add(
        'quota',
        list.map((r) => r.task.task),
        `${tokens} tokens em ${access.id}, que tem ${budget} descontada a margem`,
      );
    }
  }

  for (const { task, machine } of resolved) {
    for (const requirement of task.requirements) {
      if (requirement.mobility === 'fixed' && !machine.capabilities.includes(requirement.capability)) {
        add('fixed-requirement', [task.task], `${machine.id} nao tem ${requirement.capability}`);
      }
    }
  }

  for (const { task, access, model } of resolved) {
    if (model.competence < task.estimated) {
      add(
        'competence',
        [task.task],
        `${model.name} em ${access.id} cobre ate ${model.competence}, a task e ${task.estimated}`,
      );
    }
  }

  for (const { task, access } of resolved) {
    if (!covers(access.clearance, task.sensitivity)) {
      add('data', [task.task], `${access.id} e ${access.clearance}, a task e ${task.sensitivity}`);
    }
  }

  const startOf = new Map(resolved.map((r) => [r.task.task, r.assignment.at]));
  for (const { task, assignment } of resolved) {
    for (const dependency of task.dependsOn) {
      const at = startOf.get(dependency);
      if (at === undefined || at >= assignment.at) {
        add('dependency', [task.task, dependency], `${dependency} precisa comecar antes de ${task.task}`);
      }
    }
  }

  const slots = new Map<string, Resolved[]>();
  for (const r of resolved) {
    const slot = `${r.machine.id}\u0000${r.assignment.at}`;
    slots.set(slot, [...(slots.get(slot) ?? []), r]);
  }
  for (const list of slots.values()) {
    const machine = list[0]?.machine;
    if (machine === undefined || list.length <= machine.concurrency) continue;
    add(
      'concurrency',
      list.map((r) => r.task.task),
      `${list.length} lotes em ${machine.id}, que comporta ${machine.concurrency}`,
    );
  }

  for (const { task, assignment } of resolved) {
    if (!task.interactive) continue;
    if (!problem.presence.some((w) => w.from <= assignment.at && assignment.at < w.to)) {
      add('presence', [task.task], `${task.task} e interativa e ninguem esta presente em ${assignment.at}`);
    }
  }

  for (const assignment of unknown) {
    add('unknown-reference', [assignment.task], `a atribuicao de ${assignment.task} cita o que o problema nao tem`);
  }

  return found;
}

/**
 * Os momentos que o guloso considera: agora, o comeco de cada janela de
 * presenca ainda por vir, e uma grade de hora em hora com um passo por task,
 * o bastante para uma cadeia de dependencias inteira.
 */
function moments(problem: SchedulingProblem): Instant[] {
  const set = new Set<number>([problem.now]);
  for (const window of problem.presence) {
    if (window.to > problem.now) set.add(Math.max(window.from, problem.now));
  }
  for (let step = 1; step <= problem.tasks.length; step += 1) set.add(problem.now + step * HOUR);
  return [...set].sort((a, b) => a - b).map(instant);
}

/**
 * O guloso: as tasks pela prioridade (o valor), cada uma na conta, no
 * modelo dela, na maquina e no momento que mais aumenta a nota do plano sem ferir restricao.
 * Uma task espera as dependencias; a que nao cabe fica adiada com a restricao
 * da tentativa que menos feriu.
 */
export function suggestPlan(problem: SchedulingProblem, weights: ObjectiveWeights): SuggestedPlan {
  const order = [...problem.tasks].sort((a, b) => b.value - a.value);
  const times = moments(problem);
  const assignments: Assignment[] = [];
  const deferred: DeferredTask[] = [];
  const known = new Set(problem.tasks.map((t) => t.task));
  const assigned = new Set<TaskRef>();
  const given = new Set<TaskRef>();
  const defer = (task: TaskRef, reason: ConstraintCode) => {
    deferred.push({ task, reason });
    given.add(task);
  };

  const place = (task: SchedulingTask): void => {
    let best: { assignment: Assignment; total: number } | undefined;
    let closest: readonly ConstraintViolation[] | undefined;
    for (const at of times) {
      for (const access of problem.accesses) {
        for (const model of access.models) {
          for (const machine of problem.machines) {
            const assignment: Assignment = {
              task: task.task,
              access: access.id,
              model: model.name,
              machine: machine.id,
              at,
            };
            const candidate: Plan = { problem, assignments: [...assignments, assignment] };
            const broken = violations(candidate);
            if (broken.length > 0) {
              if (closest === undefined || broken.length < closest.length) closest = broken;
              continue;
            }
            const total = scorePlan(candidate, weights).total;
            if (best === undefined || total > best.total) best = { assignment, total };
          }
        }
      }
    }
    if (best === undefined) {
      defer(task.task, closest?.[0]?.code ?? 'unknown-reference');
      return;
    }
    assignments.push(best.assignment);
    assigned.add(task.task);
  };

  let pending = order;
  while (pending.length > 0) {
    const waiting: SchedulingTask[] = [];
    for (const task of pending) {
      if (task.dependsOn.some((d) => !known.has(d) || given.has(d))) defer(task.task, 'dependency');
      else if (task.dependsOn.some((d) => !assigned.has(d))) waiting.push(task);
      else place(task);
    }
    if (waiting.length === pending.length) {
      for (const task of waiting) defer(task.task, 'dependency');
      break;
    }
    pending = waiting;
  }

  const plan: Plan = { problem, assignments };
  return { plan, score: scorePlan(plan, weights), deferred };
}

class MemoryScheduler extends MemoryPlugin<SchedulerEvents> implements IScheduler {
  readonly key = pluginKey('scheduler');
  readonly name = 'Scheduler';
  readonly description = 'The objective function, its constraints and the suggested plan';

  scorePlan(plan: Plan, weights: ObjectiveWeights): PlanScore {
    return scorePlan(plan, weights);
  }

  violations(plan: Plan): readonly ConstraintViolation[] {
    return violations(plan);
  }

  async suggest(problem: SchedulingProblem, weights: ObjectiveWeights): Promise<SuggestedPlan> {
    const suggested = suggestPlan(problem, weights);
    this.emit('scheduler:plan-suggested', {
      assignments: suggested.plan.assignments,
      deferred: suggested.deferred,
      total: suggested.score.total,
    });
    return suggested;
  }

  constructor(clock: IClockPort) {
    super(clock);
  }
}

/**
 * O escalonador em memoria. A funcao objetivo e as restricoes nao precisam de
 * porta nenhuma; o relogio so data o evento do plano sugerido.
 */
export function createMemoryScheduler(ports: { readonly clock: IClockPort }): IScheduler {
  return new MemoryScheduler(ports.clock);
}
