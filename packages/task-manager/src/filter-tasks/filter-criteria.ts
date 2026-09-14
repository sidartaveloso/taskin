import { TaskStatusSchema, TaskTypeSchema } from '@opentask/taskin-types';
import { z } from 'zod';

/**
 * Os criterios que restringem uma listagem, definidos **uma vez so**.
 *
 * Antes cada criterio existia em cinco lugares escritos a mao: o tipo, a flag da
 * CLI, o mapeamento da CLI, o schema JSON do MCP e o mapeamento do MCP.
 * Acrescentar um exigia lembrar dos cinco, e esquecer nao quebrava nada — so
 * fazia uma superficie ficar para tras, em silencio. O sintoma ja tinha
 * aparecido: o criterio chamava-se `assignee` e a flag da CLI chamava-se
 * `--user`, duas grafias para a mesma coisa que ninguem decidiu.
 *
 * Aqui o schema e a fonte. As superficies **derivam** dele:
 *
 * - `TaskFilterCriteria` e `z.infer` deste schema — o tipo nao se escreve a mao.
 * - O schema JSON do `list_tasks` sai de `filterCriteriaJsonSchema`.
 * - As opcoes do `taskin list` saem de `filterCriteriaCliOptions`.
 * - A validacao e a conversao saem de `parseFilterCriteria` — os dois
 *   mapeamentos a mao desaparecem.
 *
 * O portao que fecha o circuito e o `satisfies Record<keyof TaskFilterCriteria,
 * ...>` em {@link FILTER_CRITERIA_SURFACES}: acrescentar um criterio ao schema e
 * **nao** ligar a superficie vira erro de compilacao, que e o unico lembrete que
 * nao depende de ninguem lembrar.
 *
 * **Como acrescentar um criterio novo.** Duas linhas, e o compilador cobra a
 * segunda:
 *
 * 1. uma propriedade `.optional()` em {@link FilterCriteriaSchema};
 * 2. a entrada correspondente em {@link FILTER_CRITERIA_SURFACES} (descricao +
 *    onde mora na CLI).
 *
 * A CLI, o schema JSON do MCP e a validacao passam a conhece-lo sem mais nenhuma
 * edicao. Esquecer o passo 2 nao compila.
 */
export const FilterCriteriaSchema = z.object({
  status: TaskStatusSchema.optional(),
  type: TaskTypeSchema.optional(),
  assignee: z.string().optional(),
  open: z.boolean().optional(),
  closed: z.boolean().optional(),
  text: z.string().optional(),
});

/**
 * O que restringe uma listagem de tarefas.
 *
 * Todos os campos sao opcionais e **se somam**: informar dois exige os dois. Um
 * criterio ausente nao restringe nada. Derivado de {@link FilterCriteriaSchema}
 * — mudar o schema muda o tipo.
 *
 * @public
 */
export type TaskFilterCriteria = z.infer<typeof FilterCriteriaSchema>;

/** Onde um criterio aparece na linha de comando. */
export type CriterionCli = { readonly kind: 'positional' } | { readonly kind: 'flag'; readonly short?: string };

/**
 * O que uma superficie precisa saber de um criterio alem da sua forma: o texto
 * de ajuda (compartilhado entre `--help` da CLI e a propriedade do MCP) e onde
 * ele mora na linha de comando.
 */
export interface CriterionSurface {
  readonly description: string;
  readonly cli: CriterionCli;
}

/**
 * A superficie de cada criterio, gateada a cobrir **todos** os campos de
 * {@link TaskFilterCriteria}.
 *
 * O `satisfies Record<keyof TaskFilterCriteria, ...>` e o portao: acrescentar um
 * criterio ao schema sem uma entrada aqui nao compila.
 */
export const FILTER_CRITERIA_SURFACES = {
  status: { description: 'Exact status (pending, in-progress, done, ...)', cli: { kind: 'flag', short: 's' } },
  type: { description: 'Exact type (feat, fix, chore, ...)', cli: { kind: 'flag', short: 't' } },
  assignee: { description: 'Assignee id or name, whole or in part', cli: { kind: 'flag', short: 'u' } },
  open: { description: 'Only tasks still open', cli: { kind: 'flag' } },
  closed: { description: 'Only tasks already closed', cli: { kind: 'flag' } },
  text: { description: 'Free text over id, title, status and assignee', cli: { kind: 'positional' } },
} satisfies Record<keyof TaskFilterCriteria, CriterionSurface>;

type SurfaceMap = Record<string, CriterionSurface>;

/** O schema JSON de entrada de uma ferramenta MCP: objeto com propriedades. */
export interface FilterJsonSchema {
  readonly type: 'object';
  readonly properties: Record<string, unknown>;
  readonly required: string[];
}

/** Uma opcao de CLI, na forma que o `commander` (e o `defineCommand`) consome. */
export interface FilterCliOption {
  readonly flags: string;
  readonly description: string;
}

/**
 * O schema JSON das propriedades de filtro, derivado do zod.
 *
 * Nao e aposta: o `packages/types-ts` ja gera JSON Schema de schemas zod pelo
 * mesmo `z.toJSONSchema()` desde a migracao para o zod 4. Aqui e o mesmo
 * mecanismo, aplicado ao schema de filtro, com a descricao de cada campo vinda
 * da superficie unica.
 *
 * Recebe schema e superficies para poder ser exercitado com um criterio
 * ficticio nos testes — a prova de que deriva, em vez de repetir a mao.
 */
export function filterCriteriaJsonSchema(
  schema: z.ZodObject = FilterCriteriaSchema,
  surfaces: SurfaceMap = FILTER_CRITERIA_SURFACES,
): FilterJsonSchema {
  const described = z.object(
    Object.fromEntries(
      Object.entries(schema.shape).map(([key, prop]) => [
        key,
        (prop as z.ZodType).describe(surfaces[key]?.description ?? ''),
      ]),
    ),
  );

  const json = z.toJSONSchema(described, { target: 'draft-7', io: 'output' }) as {
    properties?: Record<string, unknown>;
  };

  return { type: 'object', properties: json.properties ?? {}, required: [] };
}

/**
 * As opcoes do `taskin list`, derivadas das superficies.
 *
 * Um criterio `positional` (o texto livre) nao vira flag: ele e o argumento
 * `[filter]` do comando. Um criterio booleano nao leva valor (`--open`); os
 * demais levam (`-s, --status <status>`). O tipo — booleano ou nao — sai do
 * proprio schema JSON, e nao de uma segunda lista.
 */
export function filterCriteriaCliOptions(
  schema: z.ZodObject = FilterCriteriaSchema,
  surfaces: SurfaceMap = FILTER_CRITERIA_SURFACES,
): FilterCliOption[] {
  const { properties } = filterCriteriaJsonSchema(schema, surfaces);
  const options: FilterCliOption[] = [];

  for (const [key, surface] of Object.entries(surfaces)) {
    if (surface.cli.kind !== 'flag') continue;

    const short = surface.cli.short ? `-${surface.cli.short}, ` : '';
    const takesValue = (properties[key] as { type?: string } | undefined)?.type !== 'boolean';
    const flags = takesValue ? `${short}--${key} <${key}>` : `${short}--${key}`;

    options.push({ flags, description: surface.description });
  }

  return options;
}

/**
 * Valida os argumentos crus e os converte em {@link TaskFilterCriteria}.
 *
 * E o `parse` do proprio schema, sem mapeamento a mao. Chaves desconhecidas sao
 * descartadas (o `--json` do CLI, por exemplo, nao e criterio); um valor com o
 * tipo errado — um status fora do conjunto — passa a **falhar barulhento**, em
 * vez de devolver lista vazia como se nao houvesse tarefa.
 */
export function parseFilterCriteria(raw: unknown): TaskFilterCriteria {
  return FilterCriteriaSchema.parse(raw);
}
