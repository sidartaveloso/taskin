import { describe, expect, it } from 'vitest';
import {
  type NomeNaSuperficie,
  nomesNaSuperficie,
  type OperacaoDoManager,
  SUPERFICIES_DAS_OPERACOES,
  type SuperficiesDaOperacao,
} from './superficies-das-operacoes';

/*
 * O portao, provado pelo `typecheck`: uma tabela que cobre as operacoes menos
 * `setDifficulty` nao satisfaz o tipo. Se um dia a omissao passar a compilar, o
 * `@ts-expect-error` sobra e o `typecheck` falha.
 */
const { setDifficulty: _fora, ...semUma } = SUPERFICIES_DAS_OPERACOES;
// @ts-expect-error — falta 'setDifficulty': uma operacao sem superficies decididas nao compila.
const _tabelaIncompleta: Record<OperacaoDoManager, SuperficiesDaOperacao> = semUma;
void _fora;
void _tabelaIncompleta;

/* E uma superficie que tipa os handlers pelos nomes nao pode esquecer um. */
const { 'set-difficulty': _semHandler, ...handlersIncompletos } = {} as Record<NomeNaSuperficie<'ws'>, () => void>;
// @ts-expect-error — falta o handler de 'set-difficulty'.
const _wsIncompleto: Record<NomeNaSuperficie<'ws'>, () => void> = handlersIncompletos;
void _semHandler;
void _wsIncompleto;

describe('superficies das operacoes', () => {
  it('toda ausencia diz o motivo', () => {
    for (const [operacao, superficies] of Object.entries(SUPERFICIES_DAS_OPERACOES)) {
      for (const exposicao of Object.values(superficies)) {
        if ('ausente' in exposicao) expect(exposicao.ausente.length, operacao).toBeGreaterThan(10);
      }
    }
  });

  it('as operacoes de agrupar, priorizar e pontuar chegam ao dashboard', () => {
    expect(nomesNaSuperficie('ws')).toEqual(
      expect.arrayContaining([
        'assign-to-group',
        'remove-from-group',
        'set-priority',
        'move-before',
        'move-after',
        'set-difficulty',
      ]),
    );
  });

  it('pontuar chega as tres superficies (task-115)', () => {
    expect(nomesNaSuperficie('cli')).toContain('difficulty');
    expect(nomesNaSuperficie('mcp')).toContain('set_difficulty');
    expect(nomesNaSuperficie('ws')).toContain('set-difficulty');
  });

  it('um nome usado por varias operacoes aparece uma vez so', () => {
    const cli = nomesNaSuperficie('cli');
    expect(cli.filter((n) => n === 'priority')).toHaveLength(1);
  });
});
