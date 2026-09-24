import type { GroupId, Task } from '@opentask/taskin-types';
import type { IGroupRegistry } from './group-registry.types';
import { TaskManager } from './task-manager';
import { runTaskManagerContractTests } from './task-manager.contract';
import type { ITaskProvider } from './task-manager.types';

/** O proprio `TaskManager`, sobre um provider em memoria, cumpre o contrato. */
runTaskManagerContractTests(async (tarefas, grupos) => {
  const porId = new Map(tarefas.map((t) => [String(t.id), t]));

  const groupRegistry: IGroupRegistry = {
    listGroups: async () => grupos,
    findGroup: async (id: GroupId) => grupos.find((g) => g.id === id),
    createGroup: async () => {},
    renameGroup: async () => {},
    deleteGroup: async () => ({ reassigned: 0 }),
  };

  const provider: ITaskProvider & { groupRegistry: IGroupRegistry } = {
    initialize: async () => {},
    findTask: async (id) => porId.get(String(id)),
    getAllTasks: async () => [...porId.values()],
    updateTask: async (t: Task) => {
      porId.set(String(t.id), t);
    },
    createTask: async () => {
      throw new Error('nao usado');
    },
    lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    groupRegistry,
  };

  return { manager: new TaskManager(provider), ler: async (id) => porId.get(id) };
});
