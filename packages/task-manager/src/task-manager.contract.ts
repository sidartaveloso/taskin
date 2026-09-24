import { type Group, parseGroupId, parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import type { ITaskManager } from './task-manager.types.js';

/**
 * Contrato das operacoes nomeadas de agrupar, priorizar e pontuar.
 *
 * Toda implementacao de {@link ITaskManager} prova contra si mesma que estas
 * operacoes gravam o que dizem e recusam o que nao podem. E o que deixa as tres
 * superficies — CLI, MCP e o dashboard pelo servidor WebSocket — confiarem na
 * operacao sem reescrever a regra, que foi o motivo de nomea-las
 * (`docs/RDT/superficies-derivam-do-mesmo-contrato.md`).
 *
 * @param createSubject - Devolve um manager sobre as tarefas e os grupos dados,
 *   e uma forma de reler uma tarefa como a fonte a guardou — o contrato confere
 *   o que foi gravado, e nao so o que a operacao devolveu.
 * @public
 */
export function runTaskManagerContractTests(
  createSubject: (
    tarefas: Task[],
    grupos: Group[],
  ) => Promise<{ manager: ITaskManager; ler: (id: string) => Promise<Task | undefined> }>,
): void {
  const id = (valor: string) => parseTaskId(valor);
  const g = parseGroupId('g-sprint');
  const tarefa = (valor: string, extra: Partial<Task> = {}): Task =>
    ({ id: id(valor), title: `Tarefa ${valor}`, status: 'pending', type: 'feat', ...extra }) as Task;

  describe('ITaskManager contract — operacoes nomeadas', () => {
    it('assignToGroup grava o grupo na tarefa', async () => {
      const { manager, ler } = await createSubject([tarefa('001')], [{ id: g, name: 'Sprint' }]);

      await manager.assignToGroup(id('001'), g);

      expect((await ler('001'))?.groupId).toBe('g-sprint');
    });

    it('assignToGroup recusa um grupo que nao existe, sem gravar', async () => {
      const { manager, ler } = await createSubject([tarefa('001')], []);

      await expect(manager.assignToGroup(id('001'), g)).rejects.toThrow(/g-sprint/);
      expect((await ler('001'))?.groupId).toBeUndefined();
    });

    it('removeFromGroup tira a tarefa do grupo', async () => {
      const { manager, ler } = await createSubject([tarefa('001', { groupId: g })], [{ id: g, name: 'Sprint' }]);

      await manager.removeFromGroup(id('001'));

      expect((await ler('001'))?.groupId).toBeUndefined();
    });

    it('setPriority grava o numero, e recusa o que nao e inteiro positivo', async () => {
      const { manager, ler } = await createSubject([tarefa('001')], []);

      await manager.setPriority(id('001'), 30);
      expect((await ler('001'))?.order).toBe(30);

      await expect(manager.setPriority(id('001'), 0)).rejects.toThrow();
      await expect(manager.setPriority(id('001'), 1.5)).rejects.toThrow();
      expect((await ler('001'))?.order).toBe(30);
    });

    it('moveBefore e moveAfter poem a tarefa do lado pedido da referencia', async () => {
      const { manager, ler } = await createSubject(
        [tarefa('001', { order: 10 }), tarefa('002', { order: 20 }), tarefa('003', { order: 30 })],
        [],
      );
      const ordem = async (valor: string) => (await ler(valor))?.order ?? Number.POSITIVE_INFINITY;

      await manager.moveBefore(id('003'), id('001'));
      expect(await ordem('003')).toBeLessThan(await ordem('001'));

      await manager.moveAfter(id('003'), id('002'));
      expect(await ordem('003')).toBeGreaterThan(await ordem('002'));
    });

    it('setDifficulty grava de 1 a 5, e recusa o resto sem gravar', async () => {
      const { manager, ler } = await createSubject([tarefa('001')], []);

      await manager.setDifficulty(id('001'), 3);
      expect((await ler('001'))?.difficulty).toBe(3);

      for (const invalida of [0, 6, 2.5]) {
        await expect(manager.setDifficulty(id('001'), invalida)).rejects.toThrow(/difficulty/i);
      }
      expect((await ler('001'))?.difficulty).toBe(3);
    });

    it('toda operacao recusa uma tarefa que nao existe', async () => {
      const { manager } = await createSubject([], [{ id: g, name: 'Sprint' }]);
      const fantasma = id('999');

      await expect(manager.assignToGroup(fantasma, g)).rejects.toThrow(/999/);
      await expect(manager.removeFromGroup(fantasma)).rejects.toThrow(/999/);
      await expect(manager.setPriority(fantasma, 5)).rejects.toThrow(/999/);
      await expect(manager.setDifficulty(fantasma, 2)).rejects.toThrow(/999/);
    });
  });
}
