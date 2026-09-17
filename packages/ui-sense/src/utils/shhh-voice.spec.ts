import { describe, expect, it, vi } from 'vitest';
import { createShhhVoice, planejarShhh } from './shhh-voice';

describe('planejarShhh', () => {
  /*
   * A fala e o NOME, nao a frase inteira. Mandar o `speechSynthesis` pronunciar
   * "Shhhhhhhhhhhh..." produzia um arrastado sem sentido por cima do chiado
   * sintetizado, que e quem sabe fazer esse som.
   */
  it('fala o nome de quem esta sendo chamado, e nao a frase inteira', () => {
    const plano = planejarShhh({ name: 'Bruno', phrase: 'Shhhhhh...', volume: 1, vozDisponivel: true });

    expect(plano.fala).toEqual({ texto: 'Bruno,', volume: 1 });
    expect(plano.chiado.volume).toBe(1);
  });

  it('nao fala nada quando nao ha nome — so chia', () => {
    const plano = planejarShhh({ phrase: 'Shhhhhh...', volume: 1, vozDisponivel: true });

    expect(plano.fala).toBeNull();
    expect(plano.chiado.duracaoMs).toBeGreaterThan(0);
  });

  it('reserva um lapso entre a fala e o chiado, para soar como fala', () => {
    const plano = planejarShhh({ name: 'Bruno', phrase: 'Shhhhhh...', volume: 1, vozDisponivel: true });

    expect(plano.pausaMs).toBeGreaterThan(0);
  });

  it('nao reserva lapso nenhum quando nao ha fala antes', () => {
    const plano = planejarShhh({ phrase: 'Shhhhhh...', volume: 1, vozDisponivel: true });

    expect(plano.pausaMs).toBe(0);
  });

  it('chia mesmo sem voz — o som e o que atravessa a sala', () => {
    const plano = planejarShhh({ phrase: 'Shhhhhh...', volume: 1, vozDisponivel: false });

    expect(plano.fala).toBeNull();
    expect(plano.chiado.duracaoMs).toBeGreaterThan(0);
  });

  it('estica o chiado conforme os hh da frase: quem escreve mais h quer mais silencio', () => {
    const curto = planejarShhh({ phrase: 'Shh', volume: 1, vozDisponivel: false });
    const longo = planejarShhh({ phrase: 'Bruno, Shhhhhhhhhhhh...', volume: 1, vozDisponivel: false });

    expect(longo.chiado.duracaoMs).toBeGreaterThan(curto.chiado.duracaoMs);
  });

  it('nao deixa o chiado passar de tres segundos, por mais h que se escreva', () => {
    const plano = planejarShhh({ phrase: `S${'h'.repeat(200)}`, volume: 1, vozDisponivel: false });

    expect(plano.chiado.duracaoMs).toBeLessThanOrEqual(3000);
  });

  it('da um chiado minimo audivel para uma frase sem nenhum h', () => {
    const plano = planejarShhh({ phrase: 'Silencio, por favor', volume: 1, vozDisponivel: false });

    expect(plano.chiado.duracaoMs).toBeGreaterThanOrEqual(400);
  });

  it('carrega o volume pedido para os dois canais', () => {
    const plano = planejarShhh({ name: 'Bruno', phrase: 'Shhh', volume: 0.3, vozDisponivel: true });

    expect(plano.fala?.volume).toBe(0.3);
    expect(plano.chiado.volume).toBe(0.3);
  });

  it('ignora um nome so de espacos', () => {
    const plano = planejarShhh({ name: '   ', phrase: 'Shhh', volume: 1, vozDisponivel: true });

    expect(plano.fala).toBeNull();
  });
});

describe('createShhhVoice', () => {
  const contextoFalso = () => {
    const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), value: 0 }, connect: vi.fn() };
    const filtro = { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn() };
    const fonte = { buffer: null as unknown, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const contexto = {
      currentTime: 0,
      destination: {},
      state: 'running',
      resume: vi.fn(async () => {}),
      createGain: vi.fn(() => gain),
      createBiquadFilter: vi.fn(() => filtro),
      createBufferSource: vi.fn(() => fonte),
      createBuffer: vi.fn((_canais: number, quadros: number) => ({
        getChannelData: () => new Float32Array(quadros),
      })),
      sampleRate: 44100,
      close: vi.fn(async () => {}),
    };
    return { contexto, fonte, gain };
  };

  it('chama o nome e so depois chia, na ordem', async () => {
    const { contexto, fonte } = contextoFalso();
    const ordem: string[] = [];
    const falar = vi.fn(async () => {
      ordem.push('fala');
    });
    fonte.start.mockImplementation(() => {
      ordem.push('chiado');
    });

    const voz = createShhhVoice({
      criarContexto: () => contexto as unknown as AudioContext,
      falar,
      aguardar: async (ms: number) => {
        ordem.push(`pausa:${ms}`);
      },
    });

    await voz.shush({ name: 'Bruno', phrase: 'Shhhh...', volume: 0.7 });

    expect(falar).toHaveBeenCalledWith({ texto: 'Bruno,', volume: 0.7 });
    expect(ordem[0]).toBe('fala');
    expect(ordem[ordem.length - 1]).toBe('chiado');
    // o lapso entre uma coisa e outra e o que faz soar como fala; a outra
    // espera na lista e a rede de seguranca da fala travada
    expect(ordem).toContain('pausa:260');
    expect(ordem.indexOf('pausa:260')).toBeLessThan(ordem.indexOf('chiado'));
  });

  it('espera a fala terminar de verdade antes de chiar', async () => {
    const { contexto, fonte } = contextoFalso();
    let terminarFala: (() => void) | null = null;
    const voz = createShhhVoice({
      criarContexto: () => contexto as unknown as AudioContext,
      falar: () =>
        new Promise<void>((resolve) => {
          terminarFala = resolve;
        }),
      aguardar: async () => {},
    });

    const pedido = voz.shush({ name: 'Bruno', phrase: 'Shhhh...', volume: 1 });
    await Promise.resolve();

    expect(fonte.start).not.toHaveBeenCalled();

    (terminarFala as unknown as () => void)();
    await pedido;

    expect(fonte.start).toHaveBeenCalled();
  });

  it('chia na hora quando nao ha nome a chamar', async () => {
    const { contexto, fonte } = contextoFalso();
    const falar = vi.fn(async () => {});
    const voz = createShhhVoice({
      criarContexto: () => contexto as unknown as AudioContext,
      falar,
      aguardar: async () => {},
    });

    await voz.shush({ phrase: 'Shhhh...', volume: 1 });

    expect(falar).not.toHaveBeenCalled();
    expect(fonte.start).toHaveBeenCalled();
  });

  it('nao deixa uma fala travada segurar o chiado para sempre', async () => {
    const { contexto, fonte } = contextoFalso();
    const voz = createShhhVoice({
      criarContexto: () => contexto as unknown as AudioContext,
      // uma promessa que nunca resolve: `onend` do speechSynthesis nao dispara
      // em alguns navegadores quando a aba perde o foco
      falar: () => new Promise<void>(() => {}),
      aguardar: async () => {},
      esperaMaximaDaFalaMs: 0,
    });

    await voz.shush({ name: 'Bruno', phrase: 'Shhhh...', volume: 1 });

    expect(fonte.start).toHaveBeenCalled();
  });

  it('chia do mesmo jeito quando o navegador nao tem sintese de voz', async () => {
    const { contexto, fonte } = contextoFalso();
    const voz = createShhhVoice({ criarContexto: () => contexto as unknown as AudioContext, falar: null });

    await voz.shush({ phrase: 'Shhhh', volume: 1 });

    expect(fonte.start).toHaveBeenCalled();
  });

  it('nao derruba quem chamou se o audio do navegador recusar', async () => {
    const voz = createShhhVoice({
      criarContexto: () => {
        throw new Error('AudioContext bloqueado ate um gesto do usuario');
      },
      falar: null,
    });

    await expect(voz.shush({ phrase: 'Shhhh', volume: 1 })).resolves.toBeUndefined();
  });
});
