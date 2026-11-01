import { expect } from 'vitest';
import type { ResourceView } from '../../../use-cases/actors.types';
import { accessKind, capability } from '../../../use-cases/branded';
import { ANA, account, BRUNO, CLAUDE_CODE, DOCKER, machine, REPO, secretValueOf } from '../../../use-cases/scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { IInventory, InventoryEvents } from './inventory.types';

const byName = (resources: readonly ResourceView[], name: string) => resources.find((r) => r.name === name);

export const INVENTORY_CONTRACT_CASES: readonly PluginContractCase<IInventory>[] = [
  ...lifecycleCases<InventoryEvents, IInventory>(async (inventory) => {
    await inventory.declare(ANA, machine('notebook', 'docker'));
    return 'inventory:resource-declared';
  }, 'inventory:resource-declared'),
  {
    name: 'as duas camadas somadas: o que o repositorio oferece e o que a pessoa liberou',
    async run(inventory) {
      await inventory.offer(REPO, machine('servidor-1', 'docker'));
      const desktop = await inventory.declare(ANA, machine('desktop', 'android-sdk'));
      await inventory.release(ANA, desktop, REPO);

      const view = await inventory.view(ANA, REPO);

      expect(view.repository).toBe(REPO);
      expect(view.resources.map((r) => [r.name, r.layer]).sort()).toEqual([
        ['desktop', 'personal'],
        ['servidor-1', 'repository'],
      ]);
    },
  },
  {
    name: 'um recurso pessoal sem liberacao nao aparece no repositorio',
    async run(inventory) {
      await inventory.declare(ANA, machine('desktop', 'docker'));
      expect((await inventory.view(ANA, REPO)).resources).toEqual([]);
    },
  },
  {
    name: 'o recurso pessoal de uma pessoa nao aparece no quadro de outra',
    async run(inventory) {
      const desktop = await inventory.declare(ANA, machine('desktop', 'docker'));
      await inventory.release(ANA, desktop, REPO);
      expect((await inventory.view(BRUNO, REPO)).resources).toEqual([]);
    },
  },
  {
    name: 'a restricao do repositorio tira a maquina pessoal, mesmo liberada',
    async run(inventory) {
      await inventory.offer(REPO, machine('servidor-1', 'docker'));
      const desktop = await inventory.declare(ANA, machine('desktop', 'docker'));
      await inventory.release(ANA, desktop, REPO);

      await inventory.restrictPersonalMachines(REPO);

      expect((await inventory.view(ANA, REPO)).resources.map((r) => r.name)).toEqual(['servidor-1']);
      expect((await inventory.machines(ANA, REPO)).map((r) => r.name)).toEqual(['servidor-1']);
    },
  },
  {
    name: 'um acesso sem a credencial da pessoa fica no quadro, indisponivel e com o motivo',
    async run(inventory, ports) {
      const declaration = account('conta-do-time');
      await inventory.offer(REPO, declaration);
      ports.secrets.set(BRUNO, declaration.secret, secretValueOf('conta-do-time'));

      const ana = byName((await inventory.view(ANA, REPO)).resources, 'conta-do-time');
      const bruno = byName((await inventory.view(BRUNO, REPO)).resources, 'conta-do-time');

      expect(ana?.available).toBe(false);
      expect(ana?.reason?.code).toBe('missing-credential');
      expect(bruno?.available).toBe(true);
    },
  },
  {
    name: 'o quadro e os acessos nunca levam o valor de um segredo',
    async run(inventory, ports) {
      const declaration = account('conta-a');
      const id = await inventory.declare(ANA, declaration);
      await inventory.release(ANA, id, REPO);
      ports.secrets.set(ANA, declaration.secret, secretValueOf('conta-a'));

      const everything = JSON.stringify([
        await inventory.view(ANA, REPO),
        await inventory.accesses(ANA, REPO, CLAUDE_CODE),
      ]);

      expect(everything).not.toContain(secretValueOf('conta-a'));
    },
  },
  {
    name: 'o fato sondado traz quando foi visto, e expira depois do prazo; o declarado nao expira',
    async run(inventory, ports) {
      const desktop = await inventory.declare(ANA, machine('desktop', 'docker'));
      await inventory.release(ANA, desktop, REPO);
      const seenAt = ports.clock.now();

      await inventory.recordProbe(desktop, { capabilities: [DOCKER, capability('gpu')], observedAt: seenAt });

      const fresh = byName((await inventory.view(ANA, REPO)).resources, 'desktop');
      expect(fresh?.facts.find((f) => f.capability === 'gpu')).toEqual({
        capability: 'gpu',
        origin: 'probed',
        observedAt: seenAt,
        expired: false,
      });

      ports.clock.advance(ports.settings.factTtlMs + 1);
      const old = byName((await inventory.view(ANA, REPO)).resources, 'desktop');
      expect(old?.facts.find((f) => f.capability === 'gpu')?.expired).toBe(true);
      expect(old?.facts.find((f) => f.origin === 'declared')?.expired).toBe(false);
    },
  },
  {
    name: 'a maquina que nao respondeu a sondagem fica indisponivel, com o motivo',
    async run(inventory) {
      const desktop = await inventory.declare(ANA, machine('desktop', 'docker'));
      await inventory.release(ANA, desktop, REPO);

      await inventory.recordProbe(desktop, undefined);

      const view = byName((await inventory.view(ANA, REPO)).resources, 'desktop');
      expect(view?.available).toBe(false);
      expect(view?.reason?.code).toBe('unreachable');
    },
  },
  {
    name: 'os acessos de um tipo trazem a liberacao: a classificada, ou public quando nenhuma',
    async run(inventory) {
      const shared = await inventory.offer(REPO, account('conta-do-time'));
      const personal = await inventory.declare(ANA, account('conta-a'));
      await inventory.release(ANA, personal, REPO);
      await inventory.offer(REPO, account('outra', { accessKind: accessKind('outro-provedor') }));

      await inventory.classify(REPO, shared, 'sensitive');

      const accesses = await inventory.accesses(ANA, REPO, CLAUDE_CODE);
      expect(accesses.map((a) => [a.name, a.layer, a.clearance]).sort()).toEqual([
        ['conta-a', 'personal', 'public'],
        ['conta-do-time', 'repository', 'sensitive'],
      ]);
    },
  },
  {
    name: 'cada mudanca no inventario vira um evento com so o fato',
    async run(inventory) {
      await inventory.start();
      const seen = recordEvents(inventory, [
        'inventory:resource-released',
        'inventory:resource-offered',
        'inventory:personal-machines-restricted',
        'inventory:access-classified',
      ]);

      const desktop = await inventory.declare(ANA, machine('desktop', 'docker'));
      await inventory.release(ANA, desktop, REPO);
      const shared = await inventory.offer(REPO, account('conta-do-time'));
      await inventory.classify(REPO, shared, 'internal');
      await inventory.restrictPersonalMachines(REPO);

      expect(seen.map((e) => e.type)).toEqual([
        'inventory:resource-released',
        'inventory:resource-offered',
        'inventory:access-classified',
        'inventory:personal-machines-restricted',
      ]);
      expect(seen[1]?.payload).toEqual({ resource: shared, name: 'conta-do-time', kind: 'access', repository: REPO });
    },
  },
];

export function describeInventoryContract(label: string, create: CreatePlugin<IInventory>): void {
  describeCases(label, create, INVENTORY_CONTRACT_CASES);
}
