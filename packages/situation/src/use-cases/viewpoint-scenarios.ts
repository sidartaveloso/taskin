import { expect } from 'vitest';
import type { IExecutorActor, ISituationActors, ViewpointConsent, Weekday, WorkingHours } from './actors.types';
import { difficulty, expertise, type PersonId, personId, type TaskRef, taskRef } from './branded';
import type { FakePorts } from './fake-ports';
import type {
  RunPlanned,
  ViewpointAccepted,
  ViewpointAsk,
  ViewpointDenied,
  ViewpointExpired,
  ViewpointRequested,
} from './flows.types';
import { ANA, BRUNO, machine, REPO } from './scenarios';

/**
 * O elenco dos pedidos de ponto de vista. Nomes inventados, como os da
 * task-216: nenhuma pessoa de verdade, nenhum contato.
 */

export const CARLA: PersonId = personId('carla');
/** Gente de fora: nao esta no registro de pessoas do repositorio. */
export const DORA: PersonId = personId('dora');

export const DESIGN = expertise('design');
export const ELECTRONICS = expertise('electronics');
export const WRITING = expertise('writing');

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const EVERY_DAY: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Um horario em UTC, todos os dias, de `from` a `to` horas. */
export function hoursUtc(from: number, to: number): WorkingHours {
  return { weekdays: EVERY_DAY, fromMinute: from * 60, toMinute: to * 60, utcOffsetMinutes: 0 };
}

export const ALL_DAY: WorkingHours = hoursUtc(0, 24);

export function consent(
  expertiseList: readonly ViewpointAsk['expertise'][],
  options: Partial<ViewpointConsent> = {},
): ViewpointConsent {
  return { expertise: expertiseList, weeklyLoad: 5, hours: ALL_DAY, ...options };
}

/** Ana, Bruno e Carla no registro de pessoas do repositorio. Dora fica de fora. */
export function registerTeam(ports: FakePorts): void {
  ports.people.add(REPO, { id: ANA, name: 'Ana' });
  ports.people.add(REPO, { id: BRUNO, name: 'Bruno' });
  ports.people.add(REPO, { id: CARLA, name: 'Carla' });
}

/** A pergunta de sempre, com material e prazo contado a partir de agora. */
export function ask(ports: FakePorts, kind: ViewpointAsk['expertise'], dueInMs = 2 * DAY): ViewpointAsk {
  return {
    expertise: kind,
    question: 'O espacamento do cabecalho esta bom?',
    material: [{ label: 'captura do layout', uri: 'https://exemplo.invalid/captura.png' }],
    dueAt: (ports.clock.now() + dueInMs) as ViewpointAsk['dueAt'],
  };
}

export interface OpenRun {
  readonly executor: IExecutorActor;
  readonly run: RunPlanned;
  readonly task: TaskRef;
}

/** Uma execucao planejada, por esta pessoa, numa maquina dela liberada para o repositorio. */
export async function openRun(sys: ISituationActors, person: PersonId, task = 'task-9'): Promise<OpenRun> {
  const notebook = await sys.developer(person).declare(machine(`notebook-${person}`, 'docker'));
  await sys.developer(person).release(notebook, REPO);
  const executor = sys.executor(person, notebook);
  const run = await executor.planRun(REPO, taskRef(task), difficulty(2));
  return { executor, run, task: taskRef(task) };
}

export function requested(result: ViewpointRequested | ViewpointDenied): ViewpointRequested {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('requested');
  return result as ViewpointRequested;
}

export function refused(result: ViewpointRequested | ViewpointDenied): ViewpointDenied {
  expect(result.state).toBe('denied');
  return result as ViewpointDenied;
}

export function acceptedViewpoint(result: ViewpointAccepted | ViewpointExpired): ViewpointAccepted {
  expect(result.state).toBe('accepted');
  return result as ViewpointAccepted;
}
