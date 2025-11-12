/**
 * Core types for Taskin Dashboard
 * Provider-agnostic interfaces for task visualization
 */

export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'paused'
  | 'done'
  | 'blocked';

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
  id: string;
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
  warnings?: string[]; // Alert messages (e.g., "Sem tarefa em andamento", "Task bloqueada")
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
