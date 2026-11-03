import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import type { ObjectiveWeights } from '../system/plugins/scheduler/scheduler.types';

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

const accessSettingsSchema = z.object({
  /** O modelo que o acesso usa, so para dizer na sugestao. */
  model: z.string().optional(),
  competence: difficultySchema.optional(),
  /** A taxa de conclusao declarada, usada sem historico do acesso. */
  completionRate: z.number().min(0).max(1).optional(),
  costPerThousandTokens: z.number().min(0).optional(),
  /** Tokens por janela. Sem ele, o acesso nao tem teto declarado. */
  quota: z.number().int().min(0).optional(),
  windowHours: z.number().positive().optional(),
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
