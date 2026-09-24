import type { Group, GroupId } from '@opentask/taskin-types';

/**
 * O que acontece com os membros quando o grupo e apagado.
 *
 * Nao ha opcao de "nao dizer": tarefa apontando para grupo inexistente em
 * silencio foi o unico resultado considerado inaceitavel ao decidir isto. As
 * duas escolhas cobrem o que Redmine (`reassign_to_id`) e Jira (`moveIssuesTo`)
 * ja oferecem na propria chamada de exclusao.
 *
 * @public
 */
export interface DeleteGroupOptions {
  /**
   * Para onde os membros vao. Ausente, eles ficam **sem grupo** — e a operacao
   * informa quantos foram afetados, para o efeito nunca ser invisivel.
   */
  reassignTo?: GroupId;
}

/** @public */
export interface DeleteGroupResult {
  /** Quantas tarefas pertenciam ao grupo apagado. */
  reassigned: number;
}

/**
 * Operacoes de grupo que um provider oferece.
 *
 * Separado de `ITaskProvider` de proposito: nem toda fonte tem o conceito. Um
 * provider que tenha implementa isto; um que nao tenha simplesmente nao o
 * expoe, e quem consome descobre pela ausencia em vez de receber uma operacao
 * que falha — o mesmo erro do `-t sse` do `mcp-server`, que existia na flag e
 * nao na implementacao.
 *
 * @public
 */
export interface IGroupRegistry {
  listGroups: () => Promise<Group[]>;
  findGroup: (id: GroupId) => Promise<Group | undefined>;
  /** Falha quando o id ja existe. */
  createGroup: (group: Group) => Promise<void>;
  /** Falha quando o grupo nao existe. */
  renameGroup: (id: GroupId, name: string) => Promise<void>;
  /**
   * Falha quando o grupo nao existe. Os subgrupos do apagado sobem para o pai
   * dele — ou para a raiz —, como os membros vao para `reassignTo`: ninguem
   * fica apontando para o vazio.
   */
  deleteGroup: (id: GroupId, options?: DeleteGroupOptions) => Promise<DeleteGroupResult>;
  /**
   * Poe o grupo dentro de outro, ou de volta na raiz com `undefined` (task-119).
   *
   * **Opcional de proposito**, como o proprio registro: uma fonte pode ter
   * grupos e nao ter grupo dentro de grupo — a milestone do GitHub nao tem. Sem
   * este metodo, o registro tambem nao aceita `parentId` em `createGroup`, e
   * as superficies dizem isso em uma frase.
   *
   * Falha quando o grupo nao existe, ou o pai nao passa em
   * `validarAninhamento`: inexistente, o proprio grupo, um descendente dele, ou
   * alem do teto de niveis.
   */
  setParent?: (id: GroupId, parentId: GroupId | undefined) => Promise<void>;
}
