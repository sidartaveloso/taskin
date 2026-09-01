/**
 * Core types for Taskin Dashboard Components
 * Provider-agnostic interfaces for task visualization
 */

// ---------------------------------------------------------------------------
// Branded types — prevent mixing TaskId and GroupId at compile time
// ---------------------------------------------------------------------------

/**
 * Os ids vem do dominio, nao sao redeclarados aqui. Duas marcas distintas para
 * o mesmo conceito nao acrescentam seguranca: obrigam um cast em toda fronteira,
 * e foi um desses casts que engoliu campos calado na migracao para `parent`.
 *
 * O import e `import type`, entao nada de `@opentask/taskin-types` (nem do zod)
 * entra no bundle do design system — so a declaracao de tipo.
 */
export type { GroupId, TaskId } from '@opentask/taskin-types';

import type { GroupId, TaskId } from '@opentask/taskin-types';

/** Create a branded TaskId from a plain string. */
export const taskId = (id: string): TaskId => id as TaskId;

/** Create a branded GroupId from a plain string. */
export const groupId = (id: string): GroupId => id as GroupId;

// ---------------------------------------------------------------------------
// Parent reference — discriminated union
// ---------------------------------------------------------------------------

/** A task's parent can be a group or another task (subtask). */
export type ParentRef = { type: 'group'; id: GroupId } | { type: 'task'; id: TaskId };

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------

/**
 * Task lifecycle states.
 *
 * Kept deliberately decoupled from `@opentask/taskin-types` so the design system
 * stays usable without the domain packages, but the member set must match
 * `TASK_STATUSES` exactly. The dashboard asserts that at compile time, so any
 * drift breaks the build rather than silently reaching a component as a status
 * its own type says cannot exist.
 */
export type TaskStatus = 'pending' | 'in-progress' | 'paused' | 'in-review' | 'done' | 'blocked' | 'canceled';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface TimeEstimate {
  estimated: number; // hours
  spent: number; // hours
  remaining: number; // hours
}

export interface TaskDates {
  created: Date | string;
  started?: Date | string;
  dueDate?: Date | string;
  completed?: Date | string;
}

export interface ProjectPath {
  segments: string[];
}

export interface DayProgress {
  date: Date | string;
  hours: number;
  description?: string;
}

export interface TaskProgress {
  percentage: number; // 0-100
  dayLogs?: DayProgress[];
}

export interface Task {
  id: TaskId;
  number: number; // Task number (e.g., 001, 002)
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignee?: User;
  project?: ProjectPath;
  estimates?: TimeEstimate;
  dates: TaskDates;
  progress?: TaskProgress;
  tags?: string[];
  warnings?: string[]; // Alert messages (e.g., "No task in progress", "Task blocked")
  type?: string; // Task type (feat, fix, refactor, docs, test, chore, ...)
  order?: number; // Manual priority rank (lower = higher priority), set via the prioritization board
  parent?: ParentRef; // Grouping / nesting reference (replaces former groupId)
  /**
   * TEMPORARIO — o nome do grupo repetido em cada membro, espelhando o dominio,
   * que hoje tambem guarda `groupName` por task. Some quando a RDT
   * `decisoes/identidade-de-grupo-de-tasks.md` decidir onde a identidade do
   * grupo mora. Nao construa nada novo em cima deste campo.
   */
  groupName?: string;
  difficulty?: number; // Perceived difficulty (1 trivial - 5 very hard)
}

export interface DashboardConfig {
  refreshInterval?: number; // milliseconds
  columns?: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  showEmptyStates?: boolean;
}
