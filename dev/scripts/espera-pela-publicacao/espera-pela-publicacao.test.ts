import { describe, expect, it } from 'vitest';
import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import { consultarEsperando, ESPERA_PADRAO, parsearPacotesPublicados } from './espera-pela-publicacao';

const publicado = (versao: string): EstadoNoRegistry => ({ tipo: 'publicado', versao });
const ausente = (): EstadoNoRegistry => ({ tipo: 'ausente' });

/**
 * Registry falso que so passa a responder cada versao depois de N leituras —
 * o atraso de propagacao do release de 21/09, sem rede.
 */
function registryQuePropagaDepois(leiturasAteAparecer: Record<string, number>) {
  const leituras = new Map<string, number>();
  const consultar = async (nome: string, versao: string): Promise<EstadoNoRegistry> => {
    const tag = `${nome}@${versao}`;
    const feitas = (leituras.get(tag) ?? 0) + 1;
    leituras.set(tag, feitas);
    const ate = leiturasAteAparecer[tag];
    return ate !== undefined && feitas >= ate ? publicado(versao) : ausente();
  };
  return { consultar, leituras };
}

/** Relogio falso: registra quanto se pediu para dormir e volta na hora. */
function relogioFalso() {
  const sonecas: number[] = [];
  return { sonecas, dormir: async (ms: number) => void sonecas.push(ms) };
}

const taskin = { nome: '@opentask/taskin', versao: '4.1.0' };
const types = { nome: '@opentask/taskin-types', versao: '2.1.0' };

describe('parsearPacotesPublicados', () => {
  it('le o output publishedPackages da changesets/action como tags nome@versao', () => {
    const bruto = JSON.stringify([
      { name: '@opentask/taskin', version: '4.1.0' },
      { name: '@opentask/taskin-types', version: '2.1.0' },
    ]);

    expect(parsearPacotesPublicados(bruto)).toEqual(
      new Set(['@opentask/taskin@4.1.0', '@opentask/taskin-types@2.1.0']),
    );
  });

  it('trata output ausente ou vazio como nada publicado', () => {
    expect(parsearPacotesPublicados(undefined)).toEqual(new Set());
    expect(parsearPacotesPublicados('')).toEqual(new Set());
    expect(parsearPacotesPublicados('[]')).toEqual(new Set());
  });

  it('recusa um output que nao tem a forma esperada, em vez de esperar por nada', () => {
    expect(() => parsearPacotesPublicados('{"name":"x"}')).toThrow(/nao e uma lista/);
    expect(() => parsearPacotesPublicados('[{"name":"x"}]')).toThrow(/sem name\/version/);
  });
});

describe('consultarEsperando', () => {
  it('espera a versao publicada aparecer no registry — a corrida do release de 21/09', async () => {
    // 150s de propagacao com leituras de 30 em 30: aparece na sexta leitura.
    const registry = registryQuePropagaDepois({ '@opentask/taskin@4.1.0': 6 });
    const relogio = relogioFalso();

    const estados = await consultarEsperando([taskin], new Set(['@opentask/taskin@4.1.0']), registry.consultar, {
      ...ESPERA_PADRAO,
      dormir: relogio.dormir,
    });

    expect(estados.get('@opentask/taskin')).toEqual(publicado('4.1.0'));
    expect(relogio.sonecas).toEqual([30_000, 30_000, 30_000, 30_000, 30_000]);
  });

  it('pergunta uma unica vez pelo que o publish nao reportou, e a ausencia vale como resposta', async () => {
    const registry = registryQuePropagaDepois({});
    const relogio = relogioFalso();

    const estados = await consultarEsperando([taskin], new Set(), registry.consultar, {
      ...ESPERA_PADRAO,
      dormir: relogio.dormir,
    });

    expect(estados.get('@opentask/taskin')).toEqual(ausente());
    expect(registry.leituras.get('@opentask/taskin@4.1.0')).toBe(1);
    expect(relogio.sonecas).toEqual([]);
  });

  it('para no teto de tentativas e devolve a ausencia de quem nao apareceu', async () => {
    const registry = registryQuePropagaDepois({});
    const relogio = relogioFalso();

    const estados = await consultarEsperando([taskin], new Set(['@opentask/taskin@4.1.0']), registry.consultar, {
      tentativas: 3,
      intervaloMs: 30_000,
      dormir: relogio.dormir,
    });

    expect(estados.get('@opentask/taskin')).toEqual(ausente());
    expect(registry.leituras.get('@opentask/taskin@4.1.0')).toBe(3);
    expect(relogio.sonecas).toHaveLength(2);
  });

  it('so volta a perguntar pelo que falta, e avisa a cada espera quem ainda falta', async () => {
    const registry = registryQuePropagaDepois({ '@opentask/taskin@4.1.0': 1, '@opentask/taskin-types@2.1.0': 3 });
    const avisos: [string[], number, number][] = [];

    await consultarEsperando(
      [taskin, types],
      new Set(['@opentask/taskin@4.1.0', '@opentask/taskin-types@2.1.0']),
      registry.consultar,
      { ...ESPERA_PADRAO, dormir: relogioFalso().dormir, aoEsperar: (...aviso) => avisos.push(aviso) },
    );

    expect(registry.leituras.get('@opentask/taskin@4.1.0')).toBe(1);
    expect(registry.leituras.get('@opentask/taskin-types@2.1.0')).toBe(3);
    expect(avisos).toEqual([
      [['@opentask/taskin-types@2.1.0'], 2, 10],
      [['@opentask/taskin-types@2.1.0'], 3, 10],
    ]);
  });

  it('tambem insiste quando a leitura falha, se a versao foi reportada como publicada', async () => {
    let chamadas = 0;
    const consultar = async (_nome: string, versao: string): Promise<EstadoNoRegistry> =>
      ++chamadas === 1 ? { tipo: 'indeterminado', motivo: 'ETIMEDOUT' } : publicado(versao);

    const estados = await consultarEsperando([taskin], new Set(['@opentask/taskin@4.1.0']), consultar, {
      ...ESPERA_PADRAO,
      dormir: relogioFalso().dormir,
    });

    expect(estados.get('@opentask/taskin')).toEqual(publicado('4.1.0'));
  });
});
