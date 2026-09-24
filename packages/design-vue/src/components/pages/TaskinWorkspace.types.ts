import type { PrioritizationSortMode } from '../../composables/use-prioritization';

/*
 * As escolhas da barra do topo. A pagina desenha e emite; quem a hospeda
 * guarda (na URL, no dashboard) e aplica o recorte pelo dominio (task-129).
 * As listas saem daqui para o hospedeiro validar o que le da URL contra os
 * mesmos valores que a barra oferece.
 */

/** Qual tela esta aberta. */
export type WorkspaceView = 'board' | 'prioritization';

/** Qual recorte de status. */
export type WorkspaceFilter = 'open' | 'active' | 'closed' | 'all';

/** Tarefas pontuadas, nao pontuadas ou as duas. */
export type WorkspaceScore = 'all' | 'scored' | 'unscored';

/** A ordem das tarefas, a mesma do `taskin list --sort`. */
export type WorkspaceSort = PrioritizationSortMode;

export type WorkspaceConnection = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface WorkspaceOption<T extends string> {
  value: T;
  label: string;
}

export const WORKSPACE_VIEWS: readonly WorkspaceOption<WorkspaceView>[] = [
  { value: 'board', label: 'Board' },
  { value: 'prioritization', label: 'Prioritization' },
];

export const WORKSPACE_FILTERS: readonly WorkspaceOption<WorkspaceFilter>[] = [
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export const WORKSPACE_SORTS: readonly WorkspaceOption<WorkspaceSort>[] = [
  { value: 'manual', label: 'Manual (priority)' },
  { value: 'diff-desc', label: 'Difficulty ↓ (high→low)' },
  { value: 'diff-asc', label: 'Difficulty ↑ (low→high)' },
];

export const WORKSPACE_SCORES: readonly WorkspaceOption<WorkspaceScore>[] = [
  { value: 'all', label: 'Scored and unscored' },
  { value: 'scored', label: 'Scored only' },
  { value: 'unscored', label: 'Unscored only' },
];
