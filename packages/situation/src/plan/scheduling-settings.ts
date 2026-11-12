import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import type { ObjectiveWeights } from '../system/plugins/scheduler/scheduler.types';
import { DATA_CLASSES, type DataClass } from '../use-cases/branded';

/**
 * Os pesos padrao da funcao objetivo. Provisorios: a task-229 os calibra com
 * o historico. Um real de custo pesa o mesmo que uma posicao na fila; o
 * retrabalho pesa metade do valor que se perde.
 */
export const DEFAULT_WEIGHTS: ObjectiveWeights = { money: 1, setup: 1, rework: 0.5, interruptions: 1 };

/** Ate onde o plano olha: atribuicoes mais longe que isto ficam para depois. */
export const DEFAULT_HORIZON_HOURS = 24;

/** A fracao da cota que nao se planeja gastar. */
export const DEFAULT_QUOTA_MARGIN = 0.1;

/** Os tokens declarados por dificuldade, usados enquanto o registro nao tem execucoes daquela dificuldade. */
export const DEFAULT_TOKENS_BY_DIFFICULTY: Readonly<Record<1 | 2 | 3 | 4 | 5, number>> = {
  1: 20_000,
  2: 50_000,
  3: 100_000,
  4: 200_000,
  5: 400_000,
};

/** O que vale para um acesso sem entrada em `accesses`. */
export const DEFAULT_ACCESS_SETTINGS = {
  competence: 3,
  completionRate: 0.8,
  costPerThousandTokens: 0,
  windowHours: 5,
} as const;

const difficultySchema = z.number().int().min(1).max(5);

/**
 * Um modelo que a conta oferece. O que ele nao declara vem da conta e, sem
 * ela, de `DEFAULT_ACCESS_SETTINGS`.
 */
export const modelSettingsSchema = z.object({
  name: z.string().min(1),
  competence: difficultySchema.optional(),
  /** A taxa de conclusao declarada, usada sem historico do modelo. */
  completionRate: z.number().min(0).max(1).optional(),
  costPerThousandTokens: z.number().min(0).optional(),
});

/**
 * Os ajustes de uma conta. Os de uma conta do repositorio moram em
 * `resources.scheduling.accesses` do `.taskin.json`, pelo nome; os de uma
 * conta da camada da pessoa, no `scheduling` ao lado da conta em
 * `~/.config/taskin/resources.json`, para o nome dela nunca ir ao repositorio.
 */
export const accessSettingsSchema = z
  .object({
    /** Um modelo so: o mesmo que `models` com um item. */
    model: z.string().optional(),
    /** Os modelos que a conta oferece; todos dividem a cota e a janela dela. */
    models: z.array(modelSettingsSchema).min(1).optional(),
    /** O padrao dos modelos que nao declaram a sua. */
    competence: difficultySchema.optional(),
    /** A taxa de conclusao declarada, usada sem historico do acesso. */
    completionRate: z.number().min(0).max(1).optional(),
    costPerThousandTokens: z.number().min(0).optional(),
    /** Tokens por janela. Sem ele, o acesso nao tem teto declarado. */
    quota: z.number().int().min(0).optional(),
    windowHours: z.number().positive().optional(),
  })
  .refine((a) => a.model === undefined || a.models === undefined, {
    message: 'Declare either model or models for an account, not both',
    path: ['models'],
  });

export const schedulingSettingsSchema = z.object({
  weights: z
    .object({
      money: z.number().min(0).optional(),
      setup: z.number().min(0).optional(),
      rework: z.number().min(0).optional(),
      interruptions: z.number().min(0).optional(),
    })
    .optional(),
  horizonHours: z.number().positive().optional(),
  quotaMargin: z.number().min(0).max(1).optional(),
  tokensByDifficulty: z.partialRecord(z.enum(['1', '2', '3', '4', '5']), z.number().int().min(0)).optional(),
  /** Por nome logico do acesso. */
  accesses: z.record(z.string(), accessSettingsSchema).optional(),
  /** Por nome logico da maquina: quantos lotes cabem ao mesmo tempo. */
  machines: z.record(z.string(), z.object({ concurrency: z.number().int().min(1) })).optional(),
  /**
   * Os requisitos moveis, pela capacidade, com o custo de preparo. Um
   * requisito que nao esta aqui e fixo: restricao, nao custo.
   */
  movable: z.record(z.string(), z.number().min(0)).optional(),
});

export type SchedulingSettingsInput = z.infer<typeof schedulingSettingsSchema>;
export type AccessSettings = z.infer<typeof accessSettingsSchema>;
export type ModelSettings = z.infer<typeof modelSettingsSchema>;

export interface SchedulingSettings {
  readonly weights: ObjectiveWeights;
  readonly horizonHours: number;
  readonly quotaMargin: number;
  readonly tokensByDifficulty: Readonly<Record<1 | 2 | 3 | 4 | 5, number>>;
  readonly accesses: Readonly<Record<string, AccessSettings>>;
  readonly machines: Readonly<Record<string, { readonly concurrency: number }>>;
  readonly movable: Readonly<Record<string, number>>;
}

/** Completa o que a chave nao diz com os padroes. */
export function schedulingSettings(input: SchedulingSettingsInput = {}): SchedulingSettings {
  const parsed = schedulingSettingsSchema.parse(input);
  return {
    weights: { ...DEFAULT_WEIGHTS, ...parsed.weights },
    horizonHours: parsed.horizonHours ?? DEFAULT_HORIZON_HOURS,
    quotaMargin: parsed.quotaMargin ?? DEFAULT_QUOTA_MARGIN,
    tokensByDifficulty: { ...DEFAULT_TOKENS_BY_DIFFICULTY, ...parsed.tokensByDifficulty },
    accesses: parsed.accesses ?? {},
    machines: parsed.machines ?? {},
    movable: parsed.movable ?? {},
  };
}

/** Le `resources.scheduling` do `.taskin.json`; sem o arquivo ou sem a chave, os padroes. */
export function readSchedulingSettings(repositoryConfig: string): SchedulingSettings {
  if (!existsSync(repositoryConfig)) return schedulingSettings();
  const config = JSON.parse(readFileSync(repositoryConfig, 'utf8')) as {
    resources?: { scheduling?: SchedulingSettingsInput };
  };
  return schedulingSettings(config.resources?.scheduling ?? {});
}

/**
 * Os ajustes das contas da camada da pessoa, pelo nome: o `scheduling` que cada
 * conta de `person` traz ao lado da declaracao em `resources.json`. Sem o
 * arquivo ou sem a chave, nenhum.
 */
export function readPersonalAccessSettings(personalResources: string, person: string): Record<string, AccessSettings> {
  if (!existsSync(personalResources)) return {};
  const json = JSON.parse(readFileSync(personalResources, 'utf8')) as Record<
    string,
    { declaration?: { kind?: string; name?: string }; scheduling?: unknown }[] | undefined
  >;
  const settings: Record<string, AccessSettings> = {};
  for (const entry of json[person] ?? []) {
    const name = entry.declaration?.name;
    if (entry.declaration?.kind !== 'access' || name === undefined || entry.scheduling === undefined) continue;
    settings[name] = accessSettingsSchema.parse(entry.scheduling);
  }
  return settings;
}

export interface RepositorySensitivity {
  /** O padrao declarado. Sem ele, `undefined`: quem planeja usa `internal`. */
  readonly value?: DataClass;
  readonly warning?: string;
}

/**
 * Le `resources.defaultSensitivity` do `.taskin.json`: a sensibilidade da task
 * sem o campo. Um valor que nao se entende vale como `sensitive`, e avisa: um
 * erro de digitacao nunca abre o dado.
 */
export function readDefaultSensitivity(repositoryConfig: string): RepositorySensitivity {
  if (!existsSync(repositoryConfig)) return {};
  const config = JSON.parse(readFileSync(repositoryConfig, 'utf8')) as { resources?: { defaultSensitivity?: unknown } };
  const declared = config.resources?.defaultSensitivity;
  if (declared === undefined) return {};
  if (typeof declared === 'string' && (DATA_CLASSES as readonly string[]).includes(declared)) {
    return { value: declared as DataClass };
  }
  return {
    value: 'sensitive',
    warning: `resources.defaultSensitivity in .taskin.json must be one of ${DATA_CLASSES.join(', ')}: using sensitive.`,
  };
}
