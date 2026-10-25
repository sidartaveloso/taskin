import { z } from 'zod';
import type { ScoreAnswer, SystemOneRequest, SystemOneResponse } from './system-one.types';

export const SystemOneRequestSchema: z.ZodType<SystemOneRequest> = z.object({
  state: z.string(),
  questions: z.record(
    z.string(),
    z.object({ type: z.literal('score'), instructions: z.string(), criteria: z.array(z.string()).min(2) }),
  ),
});

const ScoreAnswerSchema: z.ZodType<ScoreAnswer> = z.object({
  type: z.literal('score'),
  score: z.number(),
  legend: z.record(z.string(), z.string()),
  probabilities: z.record(z.string(), z.number()),
  confidence: z.number().optional(),
  answer_confidence: z.number().optional(),
});

/** O que o Jev e o Laya devolvem; o resto do corpo (`routing`, `action`) nao interessa aqui. */
export const SystemOneResponseSchema: z.ZodType<SystemOneResponse> = z.object({
  model: z.string(),
  answers: z.record(z.string(), ScoreAnswerSchema),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }).optional(),
});
