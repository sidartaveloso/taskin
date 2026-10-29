import type { AccessDeclaration, IExecutorActor, ISituationActors, MachineDeclaration } from './actors.types';
import {
  accessKind,
  capability,
  type DataClass,
  type PersonId,
  personId,
  type RepositoryId,
  type ResourceId,
  repositoryId,
  secretRef,
  taskRef,
} from './branded';
import type { FakePorts } from './fake-ports';
import type { LeaseRequest } from './flows.types';

/**
 * O elenco de cada modo de operacao. Os nomes sao inventados de proposito:
 * nada de maquina, rede ou projeto de verdade.
 */

export const REPO: RepositoryId = repositoryId('repo-a');
export const ANA: PersonId = personId('ana');
export const BRUNO: PersonId = personId('bruno');

export const CLAUDE_CODE = accessKind('claude-code');
export const DOCKER = capability('docker');
export const ANDROID_SDK = capability('android-sdk');

export function machine(name: string, ...capabilities: string[]): MachineDeclaration {
  return { kind: 'machine', name, capabilities: capabilities.map(capability) };
}

export function account(name: string, options: Partial<AccessDeclaration> = {}): AccessDeclaration {
  return {
    kind: 'access',
    name,
    accessKind: CLAUDE_CODE,
    secret: secretRef(`op://cofre/${name}/token`),
    envVar: 'CLAUDE_CODE_OAUTH_TOKEN',
    ...options,
  };
}

export function leaseRequest(sensitivity: DataClass = 'public', task = 'task-1'): LeaseRequest {
  return { repository: REPO, task: taskRef(task), kind: CLAUDE_CODE, sensitivity };
}

/** O valor que a guarda de segredos devolve para uma conta. Os casos procuram por ele. */
export const secretValueOf = (name: string) => `segredo-de-${name}`;

/** Uma conta pessoal da Ana, liberada para o repositorio, com o segredo na guarda dela. */
async function anaAccount(sys: ISituationActors, ports: FakePorts, name: string, options?: Partial<AccessDeclaration>) {
  const declaration = account(name, options);
  const id = await sys.developer(ANA).declare(declaration);
  await sys.developer(ANA).release(id, REPO);
  ports.secrets.set(ANA, declaration.secret, secretValueOf(name));
  return id;
}

/** Uma maquina pessoal da Ana, liberada para o repositorio. */
async function anaMachine(sys: ISituationActors, name: string, ...capabilities: string[]) {
  const id = await sys.developer(ANA).declare(machine(name, ...capabilities));
  await sys.developer(ANA).release(id, REPO);
  return id;
}

export interface Scenario {
  readonly machines: readonly ResourceId[];
  readonly accounts: readonly ResourceId[];
  readonly executors: readonly IExecutorActor[];
}

/** Uma maquina e uma conta: o caso de quem esta comecando. */
export async function oneMachineOneAccount(sys: ISituationActors, ports: FakePorts): Promise<Scenario> {
  const notebook = await anaMachine(sys, 'notebook', DOCKER);
  const contaA = await anaAccount(sys, ports, 'conta-a');
  return { machines: [notebook], accounts: [contaA], executors: [sys.executor(ANA, notebook)] };
}

/** Duas maquinas e duas contas: cada lote numa conta, sem gargalo. */
export async function twoMachinesTwoAccounts(sys: ISituationActors, ports: FakePorts): Promise<Scenario> {
  const notebook = await anaMachine(sys, 'notebook', DOCKER);
  const desktop = await anaMachine(sys, 'desktop', DOCKER, ANDROID_SDK);
  const contaA = await anaAccount(sys, ports, 'conta-a');
  const contaB = await anaAccount(sys, ports, 'conta-b');
  return {
    machines: [notebook, desktop],
    accounts: [contaA, contaB],
    executors: [sys.executor(ANA, notebook), sys.executor(ANA, desktop)],
  };
}

/** Duas maquinas e uma conta: os lotes dividem a conta. */
export async function twoMachinesOneAccount(
  sys: ISituationActors,
  ports: FakePorts,
  options?: Partial<AccessDeclaration>,
): Promise<Scenario> {
  const notebook = await anaMachine(sys, 'notebook', DOCKER);
  const desktop = await anaMachine(sys, 'desktop', DOCKER);
  const contaA = await anaAccount(sys, ports, 'conta-a', options);
  return {
    machines: [notebook, desktop],
    accounts: [contaA],
    executors: [sys.executor(ANA, notebook), sys.executor(ANA, desktop)],
  };
}

/**
 * Repositorio que oferece tres servidores e restringe as maquinas pessoais:
 * o desktop da Ana, mesmo liberado, fica de fora.
 */
export async function restrictedRepository(sys: ISituationActors): Promise<Scenario> {
  const team = sys.team(REPO);
  const servers = [
    await team.offer(machine('servidor-1', DOCKER)),
    await team.offer(machine('servidor-2', DOCKER)),
    await team.offer(machine('servidor-3', DOCKER)),
  ];
  await team.restrictPersonalMachines();
  const desktop = await anaMachine(sys, 'desktop', DOCKER);
  return { machines: [...servers, desktop], accounts: [], executors: [] };
}
