export interface AppType {
  models: AppModels;
  props: AppProps;
  emits: AppEmits;
}

export type AppModels = Record<string, never>;

export type AppProps = Record<string, never>;

export type AppEmits = Record<string, never>;
