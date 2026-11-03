import { describe, expect, it } from 'vitest';
import type { CreateSituation, ISituationActors, ResourceView } from './actors.types';
import { accessKind, capability, difficulty, secretRef, taskRef, tokenCount } from './branded';
import { createFakePorts, type FakePorts } from './fake-ports';
import type { AccessGrant, AccessGranted, LeaseDenied, LeaseGranted } from './flows.types';
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
import {
  acceptedViewpoint,
  ask,
  CARLA,
  consent,
  DAY,
  DESIGN,
  DORA,
  ELECTRONICS,
  hoursUtc,
  openRun,
  refused,
  registerTeam,
  requested,
  WRITING,
} from './viewpoint-scenarios';

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

function granted(result: AccessGrant | LeaseDenied): AccessGrant {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('granted');
  return result as AccessGrant;
}

/** O acesso entregue com reserva: a conta declara capacidade. */
function reserved(result: AccessGrant | LeaseDenied): LeaseGranted {
  const grant = granted(result);
  expect(grant.reserved).toBe(true);
  return grant as LeaseGranted;
}

/** O acesso entregue sem reserva: a conta nao declara capacidade. */
function unreserved(result: AccessGrant | LeaseDenied): AccessGranted {
  const grant = granted(result);
  expect(grant.reserved).toBe(false);
  return grant as AccessGranted;
}

function denied(result: AccessGrant | LeaseDenied): LeaseDenied {
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

  // ─── O acesso a uma conta: so quem declara capacidade tem reserva ───────
  {
    name: 'o acesso entrega o segredo so no ambiente da execucao, sem reserva nem prazo, quando a conta nao declara capacidade',
    async run(sys, ports) {
      const { executors, accounts } = await oneMachineOneAccount(sys, ports);
      const grant = unreserved(await executors[0]!.requestLease(leaseRequest()));
      expect(grant.access).toBe(accounts[0]);
      expect(grant.env).toEqual({ CLAUDE_CODE_OAUTH_TOKEN: secretValueOf('conta-a') });
      for (const field of ['id', 'grantedAt', 'expiresAt', 'shared']) expect(grant).not.toHaveProperty(field);
    },
  },
  {
    name: 'a conta que declara capacidade e reservada, com prazo',
    async run(sys, ports) {
      const { executors, accounts } = await oneMachineOneAccount(sys, ports, { concurrencyLimit: 2 });
      const lease = reserved(await executors[0]!.requestLease(leaseRequest()));
      expect(lease.access).toBe(accounts[0]);
      expect(lease.env).toEqual({ CLAUDE_CODE_OAUTH_TOKEN: secretValueOf('conta-a') });
      expect(lease.expiresAt).toBe(ports.clock.now() + ports.settings.leaseTtlMs);
    },
  },
  {
    name: 'duas maquinas e duas contas: a execucao em aberto numa conta manda a proxima para a outra',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesTwoAccounts(sys, ports);
      const first = unreserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      await executors[0]!.startRun(await executors[0]!.planRun(REPO, taskRef('task-1'), difficulty(2)), first);

      const second = unreserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      await executors[1]!.startRun(await executors[1]!.planRun(REPO, taskRef('task-2'), difficulty(2)), second);

      expect(first.access).not.toBe(second.access);
      expect(new Set([first.access, second.access])).toEqual(new Set(accounts));
    },
  },
  {
    name: 'a execucao que termina libera a conta para a proxima: a menos ocupada volta a ser ela',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesTwoAccounts(sys, ports);
      const executor = executors[0]!;
      const first = unreserved(await executor.requestLease(leaseRequest('public', 'task-1')));
      const run = await executor.startRun(await executor.planRun(REPO, taskRef('task-1'), difficulty(2)), first);
      const other = unreserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(other.access).not.toBe(first.access);

      await executor.finishRun(run, {
        model: 'sonnet',
        found: difficulty(2),
        tokens: tokenCount(1_000),
        iterations: 1,
        completed: true,
        reworked: false,
      });

      expect(unreserved(await executors[1]!.requestLease(leaseRequest('public', 'task-3'))).access).toBe(accounts[0]);
    },
  },
  {
    name: 'duas maquinas e uma conta sem capacidade declarada: as duas execucoes usam a conta, sem reserva',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesOneAccount(sys, ports);
      const first = unreserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = unreserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect([first.access, second.access]).toEqual([accounts[0], accounts[0]]);
    },
  },
  {
    name: 'duas maquinas e uma conta com capacidade para duas: a segunda execucao divide a conta',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesOneAccount(sys, ports, { concurrencyLimit: 2 });
      const first = reserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = reserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect([first.access, second.access]).toEqual([accounts[0], accounts[0]]);
      expect([first.shared, second.shared]).toEqual([false, true]);
    },
  },
  {
    name: 'o acesso prefere a conta com mais folga na janela',
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

      const grant = granted(await executors[0]!.requestLease(leaseRequest()));
      expect(grant.access).toBe(accounts[1]);
    },
  },
  {
    name: 'com a capacidade declarada e sem vaga, o pedido e negado com o motivo',
    async run(sys, ports) {
      const { executors } = await twoMachinesOneAccount(sys, ports, { concurrencyLimit: 1 });
      reserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      const second = denied(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(second.reason.code).toBe('all-at-provider-limit');
    },
  },
  {
    name: 'devolver a reserva libera a vaga: a proxima execucao a recebe sem dividir',
    async run(sys, ports) {
      const { executors, accounts } = await twoMachinesOneAccount(sys, ports, { concurrencyLimit: 1 });
      const first = reserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      expect((await executors[0]!.returnLease(first)).state).toBe('returned');

      const next = reserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
      expect(next.access).toBe(accounts[0]);
      expect(next.shared).toBe(false);
    },
  },
  {
    name: 'reserva vencida libera a vaga sozinha, e devolver depois diz que venceu',
    async run(sys, ports) {
      const { executors } = await twoMachinesOneAccount(sys, ports, { concurrencyLimit: 1 });
      const old = reserved(await executors[0]!.requestLease(leaseRequest('public', 'task-1')));
      ports.clock.advance(ports.settings.leaseTtlMs + 1);

      const next = reserved(await executors[1]!.requestLease(leaseRequest('public', 'task-2')));
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
    name: 'uma conta do repositorio so e entregue a quem tem a credencial dela',
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
        model: 'sonnet',
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
        model: 'sonnet',
        tokens: 180_000,
        duration: 25 * 60 * 1000,
        access: accounts[0],
      });
      expect(await sys.developer(ANA).runs(REPO)).toEqual([
        {
          id: finished.id,
          repository: REPO,
          task: 'task-7',
          estimated: 2,
          found: 4,
          model: 'sonnet',
          tokens: 180_000,
          iterations: 3,
          completed: true,
          reworked: false,
          duration: 25 * 60 * 1000,
        },
      ]);
    },
  },
  {
    name: 'o historico de execucoes do time nao cita a conta nem horario, e nunca o segredo',
    async run(sys, ports) {
      const { executors } = await oneMachineOneAccount(sys, ports);
      const executor = executors[0]!;
      const lease = granted(await executor.requestLease(leaseRequest()));
      const started = await executor.startRun(await executor.planRun(REPO, taskRef('task-1'), difficulty(1)), lease);
      await executor.finishRun(started, {
        model: 'sonnet',
        found: difficulty(1),
        tokens: tokenCount(1_000),
        iterations: 1,
        completed: true,
        reworked: false,
      });
      const history = await sys.developer(ANA).runs(REPO);
      expect(history).toHaveLength(1);
      for (const field of ['access', 'plannedAt', 'startedAt', 'finishedAt']) {
        expect(history[0]).not.toHaveProperty(field);
      }
      expect(JSON.stringify(history)).not.toContain(secretValueOf('conta-a'));
    },
  },

  // ─── Versao 2: pessoas como recurso e o pedido de ponto de vista ────────
  {
    name: 'so quem consentiu e consultado, e so na competencia que aceitou divulgar',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN]));
      await sys.developer(CARLA).consentToViewpoints(consent([WRITING]));
      const { executor, run } = await openRun(sys, BRUNO);

      const request = requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      expect(request).toMatchObject({ reviewer: ANA, requestedBy: BRUNO, expertise: DESIGN, run: run.id });
      expect(await sys.reviewer(CARLA).requests()).toEqual([]);

      const nobody = refused(await executor.requestViewpoint(run, ask(ports, ELECTRONICS)));
      expect(nobody.reason.code).toBe('no-consenting-expert');

      await sys.developer(ANA).withdrawViewpointConsent();
      const withdrawn = refused(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      expect(withdrawn.reason.code).toBe('no-consenting-expert');
    },
  },
  {
    name: 'a carga semanal que a pessoa declarou e respeitada',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN], { weeklyLoad: 1 }));
      const { executor, run } = await openRun(sys, BRUNO);

      requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      const full = refused(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      expect(full.reason.code).toBe('over-capacity');

      ports.clock.advance(7 * DAY + 1);
      expect(requested(await executor.requestViewpoint(run, ask(ports, DESIGN))).reviewer).toBe(ANA);
    },
  },
  {
    name: 'quem fez a task nao revisa o proprio trabalho',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN]));
      const { executor, run } = await openRun(sys, ANA);

      const alone = refused(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      expect(alone.reason.code).toBe('only-the-author');

      await sys.developer(BRUNO).consentToViewpoints(consent([DESIGN]));
      expect(requested(await executor.requestViewpoint(run, ask(ports, DESIGN))).reviewer).toBe(BRUNO);
    },
  },
  {
    name: 'fora do horario, ou ausente, o pedido espera para chegar a pessoa',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN], { hours: hoursUtc(13, 18) }));
      const { executor, run } = await openRun(sys, BRUNO);
      const nineAm = ports.clock.now();

      const request = requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      expect(request.requestedAt).toBe(nineAm);
      expect(request.deliverableFrom).toBe(nineAm + 4 * HOUR);
      expect(await sys.reviewer(ANA).requests()).toEqual([]);

      ports.clock.advance(4 * HOUR);
      expect((await sys.reviewer(ANA).requests()).map((r) => r.id)).toEqual([request.id]);

      ports.presence.set(ANA, false);
      expect(await sys.reviewer(ANA).requests()).toEqual([]);
      ports.presence.set(ANA, true);
      expect((await sys.reviewer(ANA).requests()).map((r) => r.id)).toEqual([request.id]);
    },
  },
  {
    name: 'o pedido vence sozinho no prazo, e aceitar depois diz que venceu',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN]));
      const { executor, run } = await openRun(sys, BRUNO);
      const request = requested(await executor.requestViewpoint(run, ask(ports, DESIGN, 2 * HOUR)));

      ports.clock.advance(2 * HOUR + 1);

      expect(await sys.reviewer(ANA).requests()).toEqual([]);
      expect(await sys.reviewer(ANA).accept(request)).toEqual({ state: 'expired', id: request.id });
      expect((await executor.followViewpoint(request)).state).toBe('expired');
    },
  },
  {
    name: 'o ponto de vista entregue fica registrado na execucao da task',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN]));
      const { executor, run, task } = await openRun(sys, BRUNO, 'task-12');
      const request = requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));

      const accepted = acceptedViewpoint(await sys.reviewer(ANA).accept(request));
      const delivered = await sys.reviewer(ANA).deliver(accepted, 'Aumentar o respiro entre titulo e lista.');

      expect(delivered).toMatchObject({
        state: 'delivered',
        id: request.id,
        task,
        run: run.id,
        reviewer: ANA,
        answer: 'Aumentar o respiro entre titulo e lista.',
      });
      expect(await sys.developer(BRUNO).viewpoints(REPO, task)).toEqual([delivered]);
      expect(await executor.followViewpoint(request)).toEqual(delivered);
      expect(await sys.reviewer(ANA).requests()).toEqual([]);
    },
  },
  {
    name: 'o tempo de resposta e visto so pela propria pessoa, nunca como placar',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.developer(ANA).consentToViewpoints(consent([DESIGN]));
      const { executor, run, task } = await openRun(sys, BRUNO);
      const first = requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));
      const second = requested(await executor.requestViewpoint(run, ask(ports, DESIGN)));

      ports.clock.advance(2 * HOUR);
      await sys.reviewer(ANA).deliver(acceptedViewpoint(await sys.reviewer(ANA).accept(first)), 'Esta bom.');
      ports.clock.advance(HOUR);
      const declined = await sys.reviewer(ANA).decline(second, 'Sem tempo esta semana.');
      expect(declined).toMatchObject({ state: 'declined', reason: 'Sem tempo esta semana.' });

      expect(await sys.reviewer(ANA).responseTimes()).toEqual([
        { viewpoint: first.id, outcome: 'delivered', respondedIn: 2 * HOUR },
        { viewpoint: second.id, outcome: 'declined', respondedIn: 3 * HOUR },
      ]);
      expect(await sys.reviewer(BRUNO).responseTimes()).toEqual([]);

      const seenByOthers = [
        await sys.developer(BRUNO).viewpoints(REPO, task),
        await sys.developer(BRUNO).situation(REPO),
        await executor.followViewpoint(first),
      ];
      expect(JSON.stringify(seenByOthers)).not.toMatch(/respondedIn|responseTime/);
    },
  },
  {
    name: 'gente de fora so entra por convite e so ve o material do pedido',
    async run(sys, ports) {
      registerTeam(ports);
      await sys.team(REPO).offer(machine('servidor-1', 'docker'));
      await sys.developer(DORA).consentToViewpoints(consent([ELECTRONICS]));
      const { executor, run } = await openRun(sys, BRUNO);
      const question = ask(ports, ELECTRONICS);

      const uninvited = refused(await executor.requestViewpoint(run, question));
      expect(uninvited.reason.code).toBe('no-consenting-expert');

      await sys.team(REPO).invite(DORA);
      const request = requested(await executor.requestViewpoint(run, question));
      expect(request.reviewer).toBe(DORA);

      const inbox = await sys.reviewer(DORA).requests();
      expect(inbox.map((r) => [r.question, r.material])).toEqual([[question.question, question.material]]);
      expect((await sys.developer(DORA).situation(REPO)).resources).toEqual([]);
      expect(await sys.developer(DORA).runs(REPO)).toEqual([]);
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
