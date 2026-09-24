import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  type CriterionSurface,
  FILTER_CRITERIA_SURFACES,
  FilterCriteriaSchema,
  filterCriteriaCliOptions,
  filterCriteriaJsonSchema,
  parseFilterCriteria,
  type TaskFilterCriteria,
} from './filter-criteria.js';

/**
 * Um criterio sem superficie e **erro de compilacao**, e nao aviso em tempo de
 * execucao. Esta linha e a prova: um mapa que cobre `TaskFilterCriteria` menos a
 * chave `text` nao satisfaz o gate por tipo. O `@ts-expect-error` falha o
 * `typecheck` se um dia a omissao passar a compilar — que e o defeito que a task
 * fecha.
 */
const semText = { status: FILTER_CRITERIA_SURFACES.status };
// @ts-expect-error — falta a chave 'text': um criterio sem superficie nao compila.
const _gateIncompleto: Record<keyof TaskFilterCriteria, CriterionSurface> = semText;
void _gateIncompleto;

/**
 * Uma definicao so para os criterios de filtro.
 *
 * A propriedade que vale nao afirma a forma do schema — afirma que um criterio
 * definido num lugar so **aparece nas duas superficies** sem edicao manual. Por
 * isso os geradores recebem um schema e superficies: o teste acrescenta um
 * criterio ficticio e prova que ele emerge na CLI e no MCP, o que so e possivel
 * se as superficies derivarem, em vez de repetir a lista a mao.
 */
describe('criterios de filtro derivam de uma definicao so', () => {
  const schemaEstendido = FilterCriteriaSchema.extend({ fictional: z.string().optional() });
  const superficiesEstendidas = {
    ...FILTER_CRITERIA_SURFACES,
    fictional: { description: 'criterio ficticio para o teste', cli: { kind: 'flag' as const } },
  };

  it('um criterio novo aparece no schema JSON do MCP sem editar o MCP', () => {
    const json = filterCriteriaJsonSchema(schemaEstendido, superficiesEstendidas);

    expect(json.properties).toHaveProperty('fictional');
    expect((json.properties.fictional as { description?: string }).description).toBe('criterio ficticio para o teste');
  });

  it('um criterio novo aparece nas opcoes da CLI sem editar a CLI', () => {
    const opcoes = filterCriteriaCliOptions(schemaEstendido, superficiesEstendidas);

    const ficticia = opcoes.find((o) => o.flags.includes('--fictional'));
    expect(ficticia).toBeDefined();
    expect(ficticia?.description).toBe('criterio ficticio para o teste');
  });

  it('cada criterio do schema tem uma superficie — nenhum fica para tras', () => {
    const doSchema = Object.keys(FilterCriteriaSchema.shape).sort();
    const comSuperficie = Object.keys(FILTER_CRITERIA_SURFACES).sort();

    expect(comSuperficie).toEqual(doSchema);
  });
});

describe('o schema JSON derivado do MCP', () => {
  it('descreve todo criterio, e usa enum onde o valor e fechado', () => {
    const json = filterCriteriaJsonSchema();

    expect(json.type).toBe('object');
    expect(json.required).toEqual([]);
    // status e um conjunto fechado: o schema JSON traz o enum, e nao string solta.
    expect((json.properties.status as { enum?: string[] }).enum).toContain('pending');
    expect((json.properties.open as { type?: string }).type).toBe('boolean');
  });
});

describe('as opcoes derivadas da CLI', () => {
  it('booleano nao leva valor; os demais levam <chave>', () => {
    const opcoes = filterCriteriaCliOptions();
    const porFlag = (frag: string) => opcoes.find((o) => o.flags.includes(frag));

    expect(porFlag('--open')?.flags).toBe('--open');
    expect(porFlag('--status')?.flags).toBe('-s, --status <status>');
  });

  it('unifica a grafia: a flag do responsavel e --assignee, e nao --user', () => {
    const opcoes = filterCriteriaCliOptions();

    expect(opcoes.some((o) => o.flags.includes('--assignee'))).toBe(true);
    expect(opcoes.some((o) => o.flags.includes('--user'))).toBe(false);
  });

  it('o texto livre e argumento posicional, e nao vira flag', () => {
    const opcoes = filterCriteriaCliOptions();

    expect(opcoes.some((o) => o.flags.includes('--text'))).toBe(false);
  });
});

describe('parseFilterCriteria', () => {
  it('descarta chaves que nao sao criterio, como o --json', () => {
    const criteria = parseFilterCriteria({ status: 'done', json: true, foo: 1 });

    expect(criteria).toEqual({ status: 'done' });
  });

  it('falha barulhento num valor fora do conjunto, em vez de silenciar', () => {
    expect(() => parseFilterCriteria({ status: 'inexistente' })).toThrow();
  });

  it('objeto vazio e um criterio valido que nao restringe nada', () => {
    expect(parseFilterCriteria({})).toEqual({});
  });
});

describe('o criterio all', () => {
  it('vira a flag --all, sem valor, derivada do schema', () => {
    expect(filterCriteriaCliOptions().find((o) => o.flags.includes('--all'))?.flags).toBe('--all');
    expect((filterCriteriaJsonSchema().properties.all as { type?: string }).type).toBe('boolean');
  });

  it('a ajuda de --open diz que ele ja e o padrao', () => {
    expect(filterCriteriaCliOptions().find((o) => o.flags === '--open')?.description).toMatch(/default/);
  });

  it.each(['open', 'closed', 'active'])('recusa `all` combinado com `%s`', (recorte) => {
    expect(() => parseFilterCriteria({ all: true, [recorte]: true })).toThrow(/`all` cannot be combined/);
  });

  it('aceita `all` com os criterios que nao sao de status', () => {
    expect(parseFilterCriteria({ all: true, type: 'fix' })).toEqual({ all: true, type: 'fix' });
  });
});
