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

/**
 * Contrato do aninhamento (task-119), para o registro que o oferece — o que
 * implementa `setParent`. Separado de {@link runGroupRegistryContractTests}
 * porque e capacidade propria: um registro sem ela continua cumprindo aquele.
 *
 * @public
 */
export function runGroupNestingContractTests(
  createSubject: () => Promise<{ registry: IGroupRegistry & Required<Pick<IGroupRegistry, 'setParent'>> }>,
): void {
  const g = (id: string) => parseGroupId(id);

  describe('IGroupRegistry nesting contract', () => {
    it('cria um grupo ja dentro de outro, e le o pai de volta', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-pai'), name: 'Pai' });

      await registry.createGroup({ id: g('g-filho'), name: 'Filho', parentId: g('g-pai') });

      expect(await registry.findGroup(g('g-filho'))).toEqual({ id: 'g-filho', name: 'Filho', parentId: 'g-pai' });
    });

    it('aninha e desaninha um grupo que ja existe', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-pai'), name: 'Pai' });
      await registry.createGroup({ id: g('g-filho'), name: 'Filho' });

      await registry.setParent(g('g-filho'), g('g-pai'));
      expect((await registry.findGroup(g('g-filho')))?.parentId).toBe('g-pai');

      await registry.setParent(g('g-filho'), undefined);
      expect(await registry.findGroup(g('g-filho'))).toEqual({ id: 'g-filho', name: 'Filho' });
    });

    it('renomear nao mexe no pai', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-pai'), name: 'Pai' });
      await registry.createGroup({ id: g('g-filho'), name: 'Filho', parentId: g('g-pai') });

      await registry.renameGroup(g('g-filho'), 'Outro nome');

      expect((await registry.findGroup(g('g-filho')))?.parentId).toBe('g-pai');
    });

    it('recusa pai inexistente, ao criar e ao aninhar', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Um' });

      await expect(registry.createGroup({ id: g('g-2'), name: 'Dois', parentId: g('g-404') })).rejects.toThrow(/g-404/);
      await expect(registry.setParent(g('g-1'), g('g-404'))).rejects.toThrow(/g-404/);
      expect(await registry.findGroup(g('g-2'))).toBeUndefined();
    });

    it('recusa aninhar o que nao existe', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-1'), name: 'Um' });

      await expect(registry.setParent(g('g-404'), g('g-1'))).rejects.toThrow(/g-404/);
    });

    it('recusa o grupo dentro de si mesmo, e o ciclo', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-a'), name: 'A' });
      await registry.createGroup({ id: g('g-b'), name: 'B', parentId: g('g-a') });

      await expect(registry.setParent(g('g-a'), g('g-a'))).rejects.toThrow(/itself/);
      await expect(registry.setParent(g('g-a'), g('g-b'))).rejects.toThrow(/cycle/);
      expect((await registry.findGroup(g('g-a')))?.parentId).toBeUndefined();
    });

    it('recusa passar do teto de niveis', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-0'), name: 'N0' });
      for (let i = 1; i < 4; i++) {
        await registry.createGroup({ id: g(`g-${i}`), name: `N${i}`, parentId: g(`g-${i - 1}`) });
      }

      await expect(registry.createGroup({ id: g('g-4'), name: 'N4', parentId: g('g-3') })).rejects.toThrow(/levels/);
    });

    it('apagar um grupo sobe os subgrupos para o pai dele', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-avo'), name: 'Avo' });
      await registry.createGroup({ id: g('g-pai'), name: 'Pai', parentId: g('g-avo') });
      await registry.createGroup({ id: g('g-filho'), name: 'Filho', parentId: g('g-pai') });

      await registry.deleteGroup(g('g-pai'));

      expect((await registry.findGroup(g('g-filho')))?.parentId).toBe('g-avo');
    });

    it('apagar um grupo da raiz leva os subgrupos para a raiz', async () => {
      const { registry } = await createSubject();
      await registry.createGroup({ id: g('g-pai'), name: 'Pai' });
      await registry.createGroup({ id: g('g-filho'), name: 'Filho', parentId: g('g-pai') });

      await registry.deleteGroup(g('g-pai'));

      expect(await registry.findGroup(g('g-filho'))).toEqual({ id: 'g-filho', name: 'Filho' });
    });
  });
}
