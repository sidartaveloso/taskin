export interface DashboardType {
  models: DashboardModels;
  props: DashboardProps;
  emits: DashboardEmits;
}

export type DashboardModels = Record<string, never>;

export type DashboardProps = Record<string, never>;

export type DashboardEmits = Record<string, never>;
