import { describe, expect, it, vi } from 'vitest';
import { createShhhVoice, planejarShhh } from './shhh-voice';

describe('planejarShhh', () => {
  it('fala a frase e chia junto quando ha voz no navegador', () => {
    const plano = planejarShhh({ phrase: 'Shhhhhh...', volume: 1, vozDisponivel: true });

    expect(plano.fala).toEqual({ texto: 'Shhhhhh...', volume: 1 });
    expect(plano.chiado.volume).toBe(1);
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
    const plano = planejarShhh({ phrase: 'Shhh', volume: 0.3, vozDisponivel: true });

    expect(plano.fala?.volume).toBe(0.3);
    expect(plano.chiado.volume).toBe(0.3);
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

  it('toca o chiado e fala a frase', async () => {
    const { contexto, fonte } = contextoFalso();
    const falar = vi.fn();
    const voz = createShhhVoice({
      criarContexto: () => contexto as unknown as AudioContext,
      falar,
    });

    await voz.shush({ phrase: 'Bruno, Shhhh...', volume: 0.7 });

    expect(fonte.start).toHaveBeenCalled();
    expect(falar).toHaveBeenCalledWith({ texto: 'Bruno, Shhhh...', volume: 0.7 });
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
