import { describe, expect, it } from 'vitest';
import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import { planejarMarcos } from './sincronizador-de-marcos';

const publicado = (versao: string): EstadoNoRegistry => ({ tipo: 'publicado', versao });
const ausente = (): EstadoNoRegistry => ({ tipo: 'ausente' });
const indeterminado = (motivo: string): EstadoNoRegistry => ({ tipo: 'indeterminado', motivo });

describe('planejarMarcos', () => {
  it('nao mexe no que esta no npm e ja tem tag no remoto', () => {
    const plano = planejarMarcos(
      [{ nome: '@opentask/taskin', versao: '4.0.0' }],
      new Map([['@opentask/taskin', publicado('4.0.0')]]),
      new Set(['@opentask/taskin@4.0.0']),
    );

    expect(plano.aMarcar).toEqual([]);
    expect(plano.itens[0]).toMatchObject({ tipo: 'ja-marcado', tag: '@opentask/taskin@4.0.0' });
  });

  it('marca a versao que esta no npm mas nao tem tag — o buraco do release de 06/09', () => {
    const plano = planejarMarcos(
      [{ nome: '@opentask/ui-sense', versao: '0.2.0' }],
      new Map([['@opentask/ui-sense', publicado('0.2.0')]]),
      // publicou mas o `changeset publish` nao empurrou a tag.
      new Set<string>(),
    );

    expect(plano.aMarcar).toEqual([
      { tipo: 'a-marcar', pacote: '@opentask/ui-sense', tag: '@opentask/ui-sense@0.2.0' },
    ]);
    expect(plano.indeterminados).toBe(0);
  });

  it('nao cria marco para versao que ainda nao esta no npm', () => {
    const plano = planejarMarcos(
      [{ nome: '@opentask/taskin', versao: '5.0.0' }],
      // publish nem chegou neste pacote — a versao 5.0.0 nao esta no registry.
      new Map([['@opentask/taskin', ausente()]]),
      new Set<string>(),
    );

    expect(plano.aMarcar).toEqual([]);
    expect(plano.itens[0]).toMatchObject({ tipo: 'nao-publicado', tag: '@opentask/taskin@5.0.0' });
  });

  it('sinaliza indeterminado quando nao deu para perguntar ao npm', () => {
    const plano = planejarMarcos(
      [{ nome: '@opentask/taskin', versao: '4.0.0' }],
      new Map([['@opentask/taskin', indeterminado('ETIMEDOUT')]]),
      new Set<string>(),
    );

    expect(plano.aMarcar).toEqual([]);
    expect(plano.indeterminados).toBe(1);
    expect(plano.itens[0]).toMatchObject({ tipo: 'indeterminado', motivo: 'ETIMEDOUT' });
  });

  it('trata pacote sem consulta ao registry como indeterminado, nunca como marcavel', () => {
    const plano = planejarMarcos([{ nome: '@opentask/taskin', versao: '4.0.0' }], new Map(), new Set<string>());

    expect(plano.aMarcar).toEqual([]);
    expect(plano.indeterminados).toBe(1);
  });

  it('e idempotente: depois de marcar, rodar de novo com a tag presente nao propoe nada', () => {
    const pacotes = [{ nome: '@opentask/ui-sense', versao: '0.2.0' }];
    const estados = new Map([['@opentask/ui-sense', publicado('0.2.0')]]);

    const primeiro = planejarMarcos(pacotes, estados, new Set<string>());
    expect(primeiro.aMarcar).toHaveLength(1);

    // Segunda passada: a tag do primeiro plano ja foi empurrada.
    const segundo = planejarMarcos(pacotes, estados, new Set(primeiro.aMarcar.map((item) => item.tag)));
    expect(segundo.aMarcar).toEqual([]);
    expect(segundo.itens.every((item) => item.tipo === 'ja-marcado')).toBe(true);
  });

  it('mistura os estados num release parcial e devolve tudo em ordem de pacote', () => {
    const plano = planejarMarcos(
      [
        { nome: '@opentask/ui-sense', versao: '0.2.0' },
        { nome: '@opentask/taskin-types', versao: '2.0.0' },
        { nome: '@opentask/taskin', versao: '4.0.0' },
      ],
      new Map<string, EstadoNoRegistry>([
        ['@opentask/taskin-types', publicado('2.0.0')], // publicado e ja tagueado
        ['@opentask/ui-sense', publicado('0.2.0')], // publicado, sem tag
        ['@opentask/taskin', ausente()], // publish parou antes de chegar aqui
      ]),
      new Set(['@opentask/taskin-types@2.0.0']),
    );

    expect(plano.itens.map((item) => [item.pacote, item.tipo])).toEqual([
      ['@opentask/taskin', 'nao-publicado'],
      ['@opentask/taskin-types', 'ja-marcado'],
      ['@opentask/ui-sense', 'a-marcar'],
    ]);
    expect(plano.aMarcar.map((item) => item.pacote)).toEqual(['@opentask/ui-sense']);
  });
});
