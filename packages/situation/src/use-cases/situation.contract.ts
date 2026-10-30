import { describe, expect, it } from 'vitest';
import type { CreateSituation, ISituationActors, ResourceView } from './actors.types';
import { accessKind, capability, difficulty, secretRef, taskRef, tokenCount } from './branded';
import { createFakePorts, type FakePorts } from './fake-ports';
import type { LeaseDenied, LeaseGranted } from './flows.types';
import {
  ANA,
  account,
  BRUNO,
  DOCKER,
  leaseRequest,
  machine,
  oneMachineOneAccount,
  REPO,
  restrictedRepository,
  secretValueOf,
  twoMachinesOneAccount,
  twoMachinesTwoAccounts,
} from './scenarios';

/**
 * A suite de contrato do nivel 1: o que a consciencia situacional faz, caso a
 * caso, com jornadas de mais de um ator. E de quem especifica. Quem implementa
 * roda a suite contra a sua implementacao e nao muda caso nenhum: mudar um
 * caso e uma nova versao, aprovada por quem especificou.
 */

export interface ContractCase {
  readonly name: string;
  run(sys: ISituationActors, ports: FakePorts): Promise<void>;
}

const HOUR = 60 * 60 * 1000;

const byName = (resources: readonly ResourceView[], name: string) => resources.find((r) => r.name === name);

function granted(result: LeaseGranted | LeaseDenied): LeaseGranted {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('granted');
  return result as LeaseGranted;
}

function denied(result: LeaseGranted | LeaseDenied): LeaseDenied {
  expect(result.state).toBe('denied');
  return result as LeaseDenied;
}

export const SITUATION_CONTRACT_CASES: readonly ContractCase[] = [
  // ─── O inventario em duas camadas ───────────────────────────────────────
  {
    name: 'a pessoa ve a camada do repositorio somada a dela',
    async run(sys) {
      const team = sys.team(REPO);
      await team.offer(machine('servidor-1', 'docker'));
      await team.offer(machine('servidor-2', 'docker'));
      await team.offer(machine('servidor-3', 'docker', 'gpu'));
      const desktop = await sys.developer(ANA).declare(machine('desktop', 'android-sdk'));
      await sys.developer(ANA).release(desktop, REPO);

      const view = await sys.developer(ANA).situation(REPO);

      expect(view.repository).toBe(REPO);
      expect(view.resources.map((r) => [r.name, r.layer]).sort()).toEqual([
        ['desktop', 'personal'],
        ['servidor-1', 'repository'],
        ['servidor-2', 'repository'],
        ['servidor-3', 'repository'],
      ]);
      expect(byName(view.resources, 'servidor-3')?.facts.map((f) => [f.capability, f.origin])).toEqual([
        ['docker', 'declared'],
        ['gpu', 'declared'],
      ]);
    },
  },
  {
    name: 'um recurso pessoal sem liberacao nao aparece no repositorio',
    async run(sys) {
      await sys.developer(ANA).declare(machine('desktop', 'docker'));
      const view = await sys.developer(ANA).situation(REPO);
      expect(byName(view.resources, 'desktop')).toBeUndefined();
    },
  },
  {
    name: 'o recurso pessoal de uma pessoa nao aparece no quadro de outra',
    async run(sys) {
      const desktop = await sys.developer(ANA).declare(machine('desktop', 'docker'));
      await sys.developer(ANA).release(desktop, REPO);
      const view = await sys.developer(BRUNO).situation(REPO);
      expect(byName(view.resources, 'desktop')).toBeUndefined();
    },
  },
  {
    name: 'a restricao do repositorio tira a maquina pessoal, mesmo liberada',
    async run(sys) {
      await restrictedRepository(sys);
      const view = await sys.developer(ANA).situation(REPO);
      expect(view.resources.map((r) => r.name).sort()).toEqual(['servidor-1', 'servidor-2', 'servidor-3']);
    },
  },
  {
    name: 'um acesso do repositorio sem a credencial da pessoa continua no quadro, indisponivel e com o motivo',
    async run(sys, ports) {
      const declaration = account('conta-do-time');
      await sys.team(REPO).offer(declaration);
      ports.secrets.set(ANA, declaration.secret, secretValueOf('conta-do-time'));

      const ana = byName((await sys.developer(ANA).situation(REPO)).resources, 'conta-do-time');
      const bruno = byName((await sys.developer(BRUNO).situation(REPO)).resources, 'conta-do-time');

      expect(ana?.available).toBe(true);
      expect(bruno?.available).toBe(false);
      expect(bruno?.reason?.code).toBe('missing-credential');
    },
  },
  {
    name: 'o quadro nunca leva o valor de um segredo',
    async run(sys, ports) {
      await oneMachineOneAccount(sys, ports);
      const view = await sys.developer(ANA).situation(REPO);
      expect(JSON.stringify(view)).not.toContain(secretValueOf('conta-a'));
    },
  },

  // ─── Fatos com data ─────────────────────────────────────────────────────
  {
    name: 'um fato sondado traz quando foi visto, e expira depois do prazo',
    async run(sys, ports) {
      const desktop = await sys.developer(ANA).declare(machine('desktop', 'docker'));
      await sys.developer(ANA).release(desktop, REPO);
      const seenAt = ports.clock.now();
      ports.probe.set(desktop, { capabilities: [DOCKER, capability('gpu')], observedAt: seenAt });

      const fresh = byName((await sys.developer(ANA).situation(REPO)).resources, 'desktop');
      const gpu = fresh?.facts.find((f) => f.capability === 'gpu');
      expect(gpu).toEqual({ capability: 'gpu', origin: 'probed', observedAt: seenAt, expired: false });

      ports.clock.advance(ports.settings.factTtlMs + 1);
      const old = byName((await sys.developer(ANA).situation(REPO)).resources, 'desktop');
      expect(old?.facts.find((f) => f.capability === 'gpu')?.expired).toBe(true);
      expect(old?.facts.find((f) => f.origin === 'declared')?.expired).toBe(false);
    },
  },
  {
    name: 'uma maquina que nao responde a sondagem fica indisponivel, com o motivo',
    async run(sys, ports) {
      const desktop = await sys.developer(ANA).declare(machine('desktop', 'docker'));
      await sys.developer(ANA).release(desktop, REPO);
      const notebook = await sys.developer(ANA).declare(machine('notebook', 'docker'));
      await sys.developer(ANA).release(notebook, REPO);
      ports.probe.set(notebook, { capabilities: [DOCKER], observedAt: ports.clock.now() });

      const view = await sys.developer(ANA).situation(REPO);

      expect(byName(view.resources, 'notebook')?.available).toBe(true);
      expect(byName(view.resources, 'desktop')?.available).toBe(false);
      expect(byName(view.resources, 'desktop')?.reason?.code).toBe('unreachable');
    },
  },

  // ─── O emprestimo de credenciais ────────────────────────────────────────
  {
    name: 'o emprestimo entrega o segredo so no ambiente da execucao',
    async run(sys, ports) {
      const { executors, accounts } = await oneMachineOneAccount(sys, ports);
      const lease = granted(await executors[0]!.requestLease(leaseRequest()));
      expect(lease.access).toBe(accounts[0]);
      expect(lease.env).toEqual({ CLAUDE_CODE_OAUTH_TOKEN: secretValueOf('conta-a') });
      expect(lease.expiresAt).toBe(ports.clock.now() + ports.settings.leaseTtlMs);
    },
  },
  {
    name: 'duas maquinas e duas contas: cada execucao recebe uma conta, sem dividir',
    async run(sys, ports) {
      const { executors } = await twoMachinesTwoAccounts(sys, ports);
      const first = granted(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = granted(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(first.access).not.toBe(second.access);
      expect([first.shared, second.shared]).toEqual([false, false]);
    },
  },
  {
    name: 'duas maquinas e uma conta: a segunda execucao divide a conta',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesOneAccount(sys, ports);
      const first = granted(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = granted(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect([first.access, second.access]).toEqual([accounts[0], accounts[0]]);
      expect([first.shared, second.shared]).toEqual([false, true]);
    },
  },
  {
    name: 'o emprestimo prefere a conta com mais folga na janela',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesTwoAccounts(sys, ports);
      const now = ports.clock.now();
      const reading = (used: number) => ({
        used: tokenCount(used),
        limit: tokenCount(1000),
        windowEndsAt: (now + 3 * HOUR) as typeof now,
        observedAt: now,
      });
      ports.usage.set(accounts[0]!, reading(800));
      ports.usage.set(accounts[1]!, reading(200));

      const lease = granted(await executors[0]!.requestLease(leaseRequest()));
      expect(lease.access).toBe(accounts[1]);
    },
  },
  {
    name: 'com o limite do provedor declarado e sem vaga, o pedido e negado com o motivo',
    async run(sys, ports) {
      const { executors } = await twoMachinesOneAccount(sys, ports, { concurrencyLimit: 1 });
      granted(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = denied(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(second.reason.code).toBe('all-at-provider-limit');
    },
  },
  {
    name: 'devolver libera a conta: a proxima execucao a recebe sem dividir',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesOneAccount(sys, ports);
      const first = granted(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      expect((await executors[0]!.returnLease(first)).state).toBe('returned');

      const next = granted(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(next.access).toBe(accounts[0]);
      expect(next.shared).toBe(false);
    },
  },
  {
    name: 'emprestimo vencido libera a conta sozinho, e devolver depois diz que venceu',
    async run(sys, ports) {
      const { executors } = await twoMachinesOneAccount(sys, ports);
      const old = granted(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      ports.clock.advance(ports.settings.leaseTtlMs + 1);

      const next = granted(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(next.shared).toBe(false);
      expect((await executors[0]!.returnLease(old)).state).toBe('expired');
    },
  },
  {
    name: 'task sensivel so recebe acesso liberado para dado sensivel',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesTwoAccounts(sys, ports);
      await sys.team(REPO).classify(accounts[1]!, 'sensitive');

      const lease = granted(await executors[0]!.requestLease(leaseRequest('sensitive')));
      expect(lease.access).toBe(accounts[1]);
    },
  },
  {
    name: 'sem acesso liberado para a sensibilidade, o pedido e negado com o motivo',
    async run(sys, ports) {
      const { executors } = await oneMachineOneAccount(sys, ports);
      const result = denied(await executors[0]!.requestLease(leaseRequest('internal')));
      expect(result.reason.code).toBe('no-cleared-access');
    },
  },
  {
    name: 'pedir um tipo de acesso que ninguem oferece e negado com o motivo',
    async run(sys, ports) {
      const { executors } = await oneMachineOneAccount(sys, ports);
      const result = denied(
        await executors[0]!.requestLease({ ...leaseRequest(), kind: accessKind('outro-provedor') }),
      );
      expect(result.reason.code).toBe('no-access-of-kind');
    },
  },
  {
    name: 'uma conta do repositorio so e emprestada a quem tem a credencial dela',
    async run(sys, ports) {
      const declaration = account('conta-do-time', { secret: secretRef('op://time/conta/token') });
      await sys.team(REPO).offer(declaration);
      const notebook = await sys.developer(BRUNO).declare(machine('notebook-bruno', 'docker'));
      await sys.developer(BRUNO).release(notebook, REPO);

      const result = denied(await sys.executor(BRUNO, notebook).requestLease(leaseRequest()));
      expect(result.reason.code).toBe('no-access-of-kind');

      ports.secrets.set(BRUNO, declaration.secret, 'segredo-do-time');
      const lease = granted(await sys.executor(BRUNO, notebook).requestLease(leaseRequest()));
      expect(lease.env).toEqual({ CLAUDE_CODE_OAUTH_TOKEN: 'segredo-do-time' });
    },
  },

  // ─── O registro de execucao ─────────────────────────────────────────────
  {
    name: 'a execucao guarda a dificuldade estimada e a encontrada, o consumo e a duracao',
    async run(sys, ports) {
      const { executors, accounts } = await oneMachineOneAccount(sys, ports);
      const executor = executors[0]!;
      const planned = await executor.planRun(REPO, taskRef('task-7'), difficulty(2));
      const lease = granted(await executor.requestLease(leaseRequest('public', 'task-7')));
      const started = await executor.startRun(planned, lease);
      ports.clock.advance(25 * 60 * 1000);
      const finished = await executor.finishRun(started, {
        found: difficulty(4),
        tokens: tokenCount(180_000),
        iterations: 3,
        completed: true,
        reworked: false,
      });

      expect(finished).toMatchObject({
        state: 'finished',
        task: 'task-7',
        estimated: 2,
        found: 4,
        tokens: 180_000,
        duration: 25 * 60 * 1000,
        access: accounts[0],
      });
      expect(await sys.developer(ANA).runs(REPO)).toEqual([finished]);
    },
  },
  {
    name: 'o registro de execucao cita o acesso pelo nome logico, nunca pelo segredo',
    async run(sys, ports) {
      const { executors } = await oneMachineOneAccount(sys, ports);
      const executor = executors[0]!;
      const lease = granted(await executor.requestLease(leaseRequest()));
      const started = await executor.startRun(await executor.planRun(REPO, taskRef('task-1'), difficulty(1)), lease);
      await executor.finishRun(started, {
        found: difficulty(1),
        tokens: tokenCount(1_000),
        iterations: 1,
        completed: true,
        reworked: false,
      });
      expect(JSON.stringify(await sys.developer(ANA).runs(REPO))).not.toContain(secretValueOf('conta-a'));
    },
  },
];

/**
 * Registra a suite contra uma implementacao. As tasks de implementacao chamam
 * isto, uma vez por implementacao (em memoria, local, remota, simulada).
 */
export function describeSituationContract(label: string, create: CreateSituation): void {
  describe(`contrato da consciencia situacional: ${label}`, () => {
    for (const contractCase of SITUATION_CONTRACT_CASES) {
      it(contractCase.name, async () => {
        const ports = createFakePorts();
        await contractCase.run(create(ports), ports);
      });
    }
  });
}
