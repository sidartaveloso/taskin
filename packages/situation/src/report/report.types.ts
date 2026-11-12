import { z } from 'zod';

/** A versao do contrato JSON. Mudanca que quebra quem le sobe este numero. */
export const STATUS_REPORT_VERSION = 1;

/*
 * O quadro leva so nomes logicos: nenhum endereco, hostname, referencia de
 * segredo ou variavel de ambiente entra aqui, entao nenhum desenho vaza o que
 * o quadro nao tem.
 */
export const statusReportSchema = z.object({
  version: z.literal(STATUS_REPORT_VERSION),
  repository: z.string(),
  observedAt: z.number(),
  current: z.object({ id: z.string(), title: z.string() }).nullable(),
  machines: z.array(
    z.object({
      name: z.string(),
      layer: z.enum(['repository', 'personal']),
      available: z.boolean(),
      reason: z.string().optional(),
      capabilities: z.array(z.string()),
    }),
  ),
  accesses: z.array(
    z.object({
      name: z.string(),
      layer: z.enum(['repository', 'personal']),
      available: z.boolean(),
      reason: z.string().optional(),
    }),
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      requires: z.array(z.string()),
      runsHere: z.boolean(),
      missing: z.array(z.string()),
    }),
  ),
});

export type StatusReport = z.infer<typeof statusReportSchema>;

export type StatusFormat = 'text' | 'json' | 'html' | 'md';
export const STATUS_FORMATS: readonly StatusFormat[] = ['text', 'json', 'html', 'md'];
