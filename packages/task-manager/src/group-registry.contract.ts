import { parseGroupId } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import type { IGroupRegistry } from './group-registry.types.js';

/**
 * Contrato que toda implementacao de {@link IGroupRegistry} precisa cumprir.
 *
 * Vive no pacote agnostico pelo mesmo motivo do contrato de usuarios: um
 * provider de arquivos, um do Redmine e um do GitHub provam o mesmo
 * comportamento sem depender do pacote um do outro. Exportado pelo subcaminho
 * `./testing`, para o `vitest` nunca entrar no grafo de execucao.
 *
 * @param createSubject - Devolve um registro vazio, e uma forma de saber quantas
 *   tarefas pertencem a um grupo — porque apagar precisa dizer quantas foram
 *   afetadas, e isso e o unico ponto onde o contrato toca em tarefas.
 * @public
 */
export function runGroupRegistryContractTests(
  createSubject: () => Promise<{
    registry: IGroupRegistry;
    atribuir: (groupId: string, quantas: number) => Promise<void>;
  }>,
): void {
  const g = (id: string) => parseGroupId(id);

  describe('IGroupRegistry contract', () => {
    it('cria e lista', async () => {
      const { registry } = await createSubject();

      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });

      expect(await registry.listGroups()).toEqual([{ id: 'g-1', name: 'Sprint' }]);
    });

    it('acha pelo id, e devolve indefinido para o que nao existe', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });

      expect(await registry.findGroup(g('g-1'))).toEqual({ id: 'g-1', name: 'Sprint' });
      expect(await registry.findGroup(g('g-2'))).toBeUndefined();
    });

    it('recusa id repetido', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });

      await expect(registry.createGroup({ id: g('g-1'), name: 'Outro' })).rejects.toThrow();
    });

    /*
     * O ponto da entidade: o nome vive num lugar so, entao renomear e uma
     * escrita — e nenhuma tarefa e tocada.
     */
    it('renomeia sem tocar em tarefa nenhuma', async () => {
      const { registry, atribuir } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });
      await atribuir('g-1', 3);

      await registry.renameGroup(g('g-1'), 'Sprint de outubro');

      expect(await registry.findGroup(g('g-1'))).toEqual({ id: 'g-1', name: 'Sprint de outubro' });
    });

    it('recusa renomear o que nao existe', async () => {
      const { registry } = await createSubject();

      await expect(registry.renameGroup(g('g-404'), 'Qualquer')).rejects.toThrow();
    });

    it('apagar sem destino solta os membros, e diz quantos eram', async () => {
      const { registry, atribuir } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });
      await atribuir('g-1', 3);

      const resultado = await registry.deleteGroup(g('g-1'));

      expect(resultado.reassigned).toBe(3);
      expect(await registry.findGroup(g('g-1'))).toBeUndefined();
    });

    it('apagar com destino move os membros para la', async () => {
      const { registry, atribuir } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Sprint' });
      await registry.createGroup({ id: g('g-2'), name: 'Backlog' });
      await atribuir('g-1', 2);

      const resultado = await registry.deleteGroup(g('g-1'), { reassignTo: g('g-2') });

      expect(resultado.reassigned).toBe(2);
      expect(await registry.findGroup(g('g-2'))).toBeDefined();
    });

    it('recusa apagar o que nao existe', async () => {
      const { registry } = await createSubject();

      await expect(registry.deleteGroup(g('g-404'))).rejects.toThrow();
    });
  });
}
