import { expect } from 'vitest';
import { type PersonId, runId, taskRef } from '../../../use-cases/branded';
import { ANA, BRUNO, REPO } from '../../../use-cases/scenarios';
import {
  acceptedViewpoint,
  ask,
  CARLA,
  consent,
  DAY,
  DESIGN,
  DORA,
  ELECTRONICS,
  HOUR,
  hoursUtc,
  refused,
  registerTeam,
  requested,
  WRITING,
} from '../../../use-cases/viewpoint-scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { IPeople, PeopleEvents, ViewpointOrigin } from './people.types';

/** Uma execucao da task-9, que roda para esta pessoa. */
const by = (requestedBy: PersonId, task = 'task-9'): ViewpointOrigin => ({
  repository: REPO,
  task: taskRef(task),
  run: runId(`run-${task}`),
  requestedBy,
});

export const PEOPLE_CONTRACT_CASES: readonly PluginContractCase<IPeople>[] = [
  ...lifecycleCases<PeopleEvents, IPeople>(async (people) => {
    await people.consent(ANA, consent([DESIGN]));
    return 'people:consent-given';
  }, 'people:consent-given'),
  {
    name: 'so quem consentiu e consultado, e so na competencia que aceitou divulgar',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN]));
      await people.consent(CARLA, consent([WRITING]));

      const request = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      expect(request).toMatchObject({ reviewer: ANA, requestedBy: BRUNO, expertise: DESIGN, run: 'run-task-9' });
      expect(await people.requests(CARLA)).toEqual([]);

      expect(refused(await people.requestViewpoint(by(BRUNO), ask(ports, ELECTRONICS))).reason.code).toBe(
        'no-consenting-expert',
      );

      await people.withdrawConsent(ANA);
      expect(refused(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN))).reason.code).toBe(
        'no-consenting-expert',
      );
    },
  },
  {
    name: 'a lista de especialistas da so quem consentiu, sem horario nem carga',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN], { weeklyLoad: 2 }));
      await people.consent(CARLA, consent([WRITING]));

      expect(await people.experts(REPO, DESIGN)).toEqual([ANA]);
      expect(await people.experts(REPO, ELECTRONICS)).toEqual([]);
    },
  },
  {
    name: 'a carga semanal que a pessoa declarou e respeitada',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN], { weeklyLoad: 1 }));

      requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      expect(refused(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN))).reason.code).toBe('over-capacity');

      ports.clock.advance(7 * DAY + 1);
      expect(requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN))).reviewer).toBe(ANA);
    },
  },
  {
    name: 'quem fez a task nao revisa o proprio trabalho',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN]));

      expect(refused(await people.requestViewpoint(by(ANA), ask(ports, DESIGN))).reason.code).toBe('only-the-author');

      await people.consent(BRUNO, consent([DESIGN]));
      expect(requested(await people.requestViewpoint(by(ANA), ask(ports, DESIGN))).reviewer).toBe(BRUNO);
    },
  },
  {
    name: 'fora do horario, ou ausente, o pedido espera para chegar a pessoa',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN], { hours: hoursUtc(13, 18) }));
      const nineAm = ports.clock.now();

      const request = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      expect(request.deliverableFrom).toBe(nineAm + 4 * HOUR);
      expect(await people.requests(ANA)).toEqual([]);

      ports.clock.advance(4 * HOUR);
      expect((await people.requests(ANA)).map((r) => r.id)).toEqual([request.id]);

      ports.presence.set(ANA, false);
      expect(await people.requests(ANA)).toEqual([]);
    },
  },
  {
    name: 'o pedido vence sozinho no prazo, e aceitar depois diz que venceu',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN]));
      const request = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN, 2 * HOUR)));

      ports.clock.advance(2 * HOUR + 1);

      expect(await people.requests(ANA)).toEqual([]);
      expect(await people.accept(request)).toEqual({ state: 'expired', id: request.id });
      expect((await people.follow(request)).state).toBe('expired');
    },
  },
  {
    name: 'aceitar e entregar fecha o pedido com a resposta; recusar fecha com o motivo',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN]));
      const first = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      const second = requested(await people.requestViewpoint(by(BRUNO, 'task-10'), ask(ports, DESIGN)));

      const delivered = await people.deliver(acceptedViewpoint(await people.accept(first)), 'Esta bom.');
      const declined = await people.decline(second, 'Sem tempo.');

      expect(delivered).toMatchObject({ state: 'delivered', id: first.id, reviewer: ANA, answer: 'Esta bom.' });
      expect(declined).toMatchObject({ state: 'declined', id: second.id, reason: 'Sem tempo.' });
      expect(await people.follow(first)).toEqual(delivered);
      expect(await people.requests(ANA)).toEqual([]);
    },
  },
  {
    name: 'o tempo de resposta e visto so pela propria pessoa',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN]));
      const first = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      const second = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));

      ports.clock.advance(2 * HOUR);
      await people.deliver(acceptedViewpoint(await people.accept(first)), 'Esta bom.');
      ports.clock.advance(HOUR);
      await people.decline(second, 'Sem tempo.');

      expect(await people.responseTimes(ANA)).toEqual([
        { viewpoint: first.id, outcome: 'delivered', respondedIn: 2 * HOUR },
        { viewpoint: second.id, outcome: 'declined', respondedIn: 3 * HOUR },
      ]);
      expect(await people.responseTimes(BRUNO)).toEqual([]);
    },
  },
  {
    name: 'gente de fora so entra por convite e so ve o material do pedido',
    async run(people, ports) {
      registerTeam(ports);
      await people.consent(DORA, consent([ELECTRONICS]));
      const question = ask(ports, ELECTRONICS);

      expect(refused(await people.requestViewpoint(by(BRUNO), question)).reason.code).toBe('no-consenting-expert');

      await people.invite(REPO, DORA);
      expect(requested(await people.requestViewpoint(by(BRUNO), question)).reviewer).toBe(DORA);
      expect((await people.requests(DORA)).map((r) => [r.question, r.material])).toEqual([
        [question.question, question.material],
      ]);
    },
  },
  {
    name: 'os eventos nunca levam horario, carga, tempo de resposta ou o motivo de uma recusa',
    async run(people, ports) {
      await people.start();
      const seen = recordEvents(people, [
        'people:consent-given',
        'people:viewpoint-requested',
        'people:viewpoint-accepted',
        'people:viewpoint-declined',
        'people:viewpoint-delivered',
      ]);
      registerTeam(ports);
      await people.consent(ANA, consent([DESIGN], { weeklyLoad: 3, hours: hoursUtc(0, 24) }));
      const first = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      const second = requested(await people.requestViewpoint(by(BRUNO), ask(ports, DESIGN)));
      ports.clock.advance(HOUR);
      await people.deliver(acceptedViewpoint(await people.accept(first)), 'Esta bom.');
      await people.decline(second, 'Motivo pessoal.');

      expect(seen.map((e) => e.type)).toEqual([
        'people:consent-given',
        'people:viewpoint-requested',
        'people:viewpoint-requested',
        'people:viewpoint-accepted',
        'people:viewpoint-delivered',
        'people:viewpoint-declined',
      ]);
      expect(JSON.stringify(seen)).not.toMatch(/weeklyLoad|hours|fromMinute|respondedIn|Motivo pessoal/);
    },
  },
];

export function describePeopleContract(label: string, create: CreatePlugin<IPeople>): void {
  describeCases(label, create, PEOPLE_CONTRACT_CASES);
}
