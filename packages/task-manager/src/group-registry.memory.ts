import type { Group, GroupId } from '@opentask/taskin-types';
import { validarAninhamento } from './aninhar-grupos/index.js';
import type { DeleteGroupOptions, DeleteGroupResult, IGroupRegistry } from './group-registry.types.js';

/**
 * Um registro de grupos em memoria, com aninhamento, para os testes das
 * superficies e do proprio manager. Cumpre os dois contratos do registro.
 *
 * @param grupos - O estado inicial; a lista e copiada
 * @param reatribuir - Como mover os membros ao apagar; devolve quantos eram
 * @public
 */
export function registroDeGruposEmMemoria(
  grupos: readonly Group[] = [],
  reatribuir: (de: GroupId, para: GroupId | undefined) => Promise<number> = async () => 0,
): IGroupRegistry & Required<Pick<IGroupRegistry, 'setParent'>> & { readonly grupos: Group[] } {
  const estado: Group[] = grupos.map((g) => ({ ...g }));
  const exigir = (id: GroupId) => {
    const grupo = estado.find((g) => g.id === id);
    if (!grupo) throw new Error(`Group '${id}' not found.`);
    return grupo;
  };

  return {
    grupos: estado,
    listGroups: async () => estado.map((g) => ({ ...g })),
    findGroup: async (id) => {
      const grupo = estado.find((g) => g.id === id);
      return grupo && { ...grupo };
    },
    createGroup: async (group) => {
      if (estado.some((g) => g.id === group.id)) throw new Error(`Group '${group.id}' already exists.`);
      if (group.parentId !== undefined) validarAninhamento(estado, group.id, group.parentId);
      estado.push({ ...group });
    },
    renameGroup: async (id, name) => {
      exigir(id).name = name;
    },
    setParent: async (id, parentId) => {
      const grupo = exigir(id);
      if (parentId === undefined) {
        delete grupo.parentId;
        return;
      }
      validarAninhamento(estado, id, parentId);
      grupo.parentId = parentId;
    },
    deleteGroup: async (id, options: DeleteGroupOptions = {}): Promise<DeleteGroupResult> => {
      const apagado = exigir(id);
      const reassigned = await reatribuir(id, options.reassignTo);
      for (const filho of estado.filter((g) => g.parentId === id)) {
        if (apagado.parentId === undefined) delete filho.parentId;
        else filho.parentId = apagado.parentId;
      }
      estado.splice(estado.indexOf(apagado), 1);
      return { reassigned };
    },
  };
}
