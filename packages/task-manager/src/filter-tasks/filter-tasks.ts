import type { Task, TaskStatus } from '@opentask/taskin-types';
import type { TaskFilterCriteria, TaskSummary } from './filter-tasks.types.js';

/**
 * O que conta como "ainda em aberto".
 *
 * `paused` e `in-review` entram: a tarefa nao foi entregue nem descartada, so
 * nao esta sendo tocada agora. Deixa-las de fora escondia trabalho em curso de
 * quem filtrava por `--open`.
 */
const EM_ABERTO: readonly TaskStatus[] = ['pending', 'in-progress', 'paused', 'in-review', 'blocked'];

const ENCERRADOS: readonly TaskStatus[] = ['done', 'canceled'];

const contem = (valor: string | undefined, procurado: string): boolean =>
  valor !== undefined && valor.toLowerCase().includes(procurado);

/**
 * Casa o responsavel por id ou nome, inteiro ou em parte.
 *
 * Tarefa sem responsavel nunca casa: filtrar por uma pessoa e perguntar "o que
 * e dela", e "de ninguem" nao e resposta.
 */
function casaResponsavel(task: Task, procurado: string): boolean {
  const alvo = procurado.toLowerCase();
  return contem(task.assignee?.id, alvo) || contem(task.assignee?.name, alvo);
}

/**
 * Seleciona tarefas por criterio, sem saber como elas serao exibidas.
 *
 * Vive aqui, no pacote agnostico, porque a mesma pergunta e feita de tres
 * lugares: o comando `list`, a saida em JSON e o servidor MCP. Antes eram duas
 * implementacoes que ja discordavam — o comando casava o responsavel por
 * substring em nome ou id, e a classe `Taskin` casava `userId` exato.
 *
 * Nao ordena e nao muda o arranjo recebido: a ordem que entra e a que sai.
 *
 * @public
 */
export function filterTasks(tasks: readonly Task[], criteria: TaskFilterCriteria): Task[] {
  return tasks.filter((task) => {
    if (criteria.status !== undefined) {
      if (task.status !== criteria.status) return false;
    } else if (criteria.open && !EM_ABERTO.includes(task.status)) {
      return false;
    } else if (criteria.closed && !ENCERRADOS.includes(task.status)) {
      return false;
    }

    if (criteria.type !== undefined && task.type !== criteria.type) return false;

    if (criteria.assignee !== undefined && !casaResponsavel(task, criteria.assignee)) return false;

    if (criteria.text !== undefined) {
      const procurado = criteria.text.toLowerCase();
      const casa =
        task.id.toLowerCase().includes(procurado) ||
        contem(task.title, procurado) ||
        contem(task.status, procurado) ||
        casaResponsavel(task, procurado);
      if (!casa) return false;
    }

    return true;
  });
}

/**
 * O que identifica uma tarefa numa listagem, sem o que ela diz.
 *
 * O provider de arquivos carrega o markdown inteiro em `content` e
 * `description`. Incluir isso faria a listagem deste repositorio passar de
 * vinte mil linhas — e quem lista quer **escolher** uma tarefa, nao le-las
 * todas. O corpo se busca depois, pelo id.
 *
 * @public
 */
export function summarizeTask(task: Task): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    type: task.type,
    ...(task.assignee && { assignee: { id: task.assignee.id, name: task.assignee.name } }),
    ...(task.order !== undefined && { priority: task.order }),
    ...(task.groupId && { groupId: task.groupId }),
    ...(task.groupName && { groupName: task.groupName }),
    ...(task.difficulty !== undefined && { difficulty: task.difficulty }),
  };
}
