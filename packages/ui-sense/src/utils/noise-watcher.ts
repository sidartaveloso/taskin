import { DEFAULT_AUDIO_CONSTRAINTS, requestMediaStream } from './camera';

type NoiseCallback = () => void;
type NoiseLevelCallback = (rms: number) => void;

/**
 * Tempos de uma inscricao em `onNoiseAbove`. Os dois respondem a perguntas
 * diferentes: `sustainMs` e quanto tempo o barulho precisa se manter alto ANTES
 * do primeiro disparo, e `debounceMs` e quanto precisa passar DEPOIS dele ate o
 * proximo. Sem sustentacao, um estalo de porta pede silencio igual a um minuto
 * de conversa alta.
 */
export interface NoiseThresholdOptions {
  /** Intervalo minimo entre dois disparos, em ms. */
  debounceMs?: number;
  /**
   * Janela deslizante em que a sustentacao e medida, em ms. Zero dispara na
   * primeira amostra acima do limiar.
   */
  sustainMs?: number;
  /**
   * Fracao da janela que precisa estar acima do limiar, de 0 a 1. Uma fala nao
   * e um plato — entre silabas e frases ha vales de 100 a 400ms —, entao exigir
   * barulho ininterrupto detecta um secador de cabelo e nao detecta gente
   * conversando. Com 1 a exigencia volta a ser ininterrupta.
   */
  sustainRatio?: number;
}

/** Terceiro argumento de `onNoiseAbove`: o objeto de tempos, ou so o debounce. */
export type NoiseThresholdTiming = number | NoiseThresholdOptions;

export interface NoiseWatcher {
  onNoiseAbove: (threshold: number, cb: NoiseCallback, timing?: NoiseThresholdTiming) => () => void;
  subscribeLevel: (cb: NoiseLevelCallback) => () => void;
  getCurrentLevel: () => number;
  stop: () => Promise<void>;
}

/** Minimum gap between two reactions when a caller does not pass `debounceMs`. */
export const DEFAULT_NOISE_DEBOUNCE_MS = 1500;

/**
 * Sem sustentacao por padrao: a primeira amostra acima do limiar dispara, que e
 * o comportamento que as stories e as configuracoes ja escritas esperam. Quem
 * quiser exigir barulho sustentado opta por isso.
 */
export const DEFAULT_NOISE_SUSTAIN_MS = 0;

/**
 * Fracao padrao da janela que precisa estar alta. Numa janela de 3s a 40ms por
 * amostra, uma porta batendo ocupa 1 a 4% e uma conversa alta 60 a 87%: 0.6 cai
 * no vao largo entre os dois.
 */
export const DEFAULT_NOISE_SUSTAIN_RATIO = 0.6;

interface ThresholdListener {
  threshold: number;
  cb: NoiseCallback;
  debounceMs: number;
  sustainMs: number;
  sustainRatio: number;
  lastFired: number;
  /** Amostras dentro da janela: instante e se estavam acima do limiar. */
  samples: { t: number; loud: boolean }[];
  /** Primeira amostra ja vista; a janela so e avaliada depois de coberta. */
  firstSampleAt: number | null;
}

const resolveTiming = (
  timing: NoiseThresholdTiming | undefined,
): { debounceMs: number; sustainMs: number; sustainRatio: number } => {
  if (typeof timing === 'number') {
    return {
      debounceMs: timing,
      sustainMs: DEFAULT_NOISE_SUSTAIN_MS,
      sustainRatio: DEFAULT_NOISE_SUSTAIN_RATIO,
    };
  }
  return {
    debounceMs: timing?.debounceMs ?? DEFAULT_NOISE_DEBOUNCE_MS,
    sustainMs: timing?.sustainMs ?? DEFAULT_NOISE_SUSTAIN_MS,
    sustainRatio: timing?.sustainRatio ?? DEFAULT_NOISE_SUSTAIN_RATIO,
  };
};

/**
 * The pure threshold/debounce/level core of the noise watcher, with no audio
 * dependency. `dispatch(rms, now)` feeds one amplitude sample in; the browser
 * audio sampler in {@link createNoiseWatcher} owns everything that needs a Web
 * Audio API. Splitting it out is what lets the debounce logic be unit-tested
 * with a fake clock instead of a real microphone.
 */
export interface NoiseDispatcher {
  onNoiseAbove: (threshold: number, cb: NoiseCallback, timing?: NoiseThresholdTiming) => () => void;
  subscribeLevel: (cb: NoiseLevelCallback) => () => void;
  getCurrentLevel: () => number;
  dispatch: (rms: number, now?: number) => void;
}

export function createNoiseDispatcher(): NoiseDispatcher {
  const levelListeners = new Set<NoiseLevelCallback>();
  const listeners = new Set<ThresholdListener>();
  let lastRms = 0;

  return {
    onNoiseAbove(threshold: number, cb: NoiseCallback, timing?: NoiseThresholdTiming) {
      const { debounceMs, sustainMs, sustainRatio } = resolveTiming(timing);
      // Start in the distant past so the first sample above the threshold fires
      // regardless of where the clock happens to start.
      const listener: ThresholdListener = {
        threshold,
        cb,
        debounceMs,
        sustainMs,
        sustainRatio,
        lastFired: Number.NEGATIVE_INFINITY,
        samples: [],
        firstSampleAt: null,
      };
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeLevel(cb: NoiseLevelCallback) {
      levelListeners.add(cb);
      // provide the last known value immediately
      try {
        cb(lastRms);
      } catch {}
      return () => levelListeners.delete(cb);
    },
    getCurrentLevel() {
      return lastRms;
    },
    dispatch(rms: number, now = Date.now()) {
      lastRms = rms;
      for (const cb of levelListeners) {
        try {
          cb(rms);
        } catch {}
      }
      for (const l of listeners) {
        const loud = rms >= l.threshold;
        const fire = () => {
          // O debounce conta do disparo, nao do inicio do barulho: os dois
          // tempos sao independentes e podem ser lidos separados.
          if (now - l.lastFired <= l.debounceMs) return;
          l.lastFired = now;
          try {
            l.cb();
          } catch {}
        };

        if (l.sustainMs <= 0) {
          if (loud) fire();
          continue;
        }

        l.firstSampleAt ??= now;
        l.samples.push({ t: now, loud });
        const inicioDaJanela = now - l.sustainMs;
        while (l.samples.length > 0 && (l.samples[0] as { t: number }).t < inicioDaJanela) {
          l.samples.shift();
        }

        // Enquanto nao se observou uma janela inteira nao da para falar em
        // fracao: as primeiras amostras altas dariam 100% e disparariam na hora,
        // que e exatamente o que este criterio existe para evitar.
        if (now - l.firstSampleAt < l.sustainMs) continue;

        const altas = l.samples.reduce((n, s) => n + (s.loud ? 1 : 0), 0);
        if (altas / l.samples.length >= l.sustainRatio) fire();
      }
    },
  };
}

export async function createNoiseWatcher(): Promise<NoiseWatcher> {
  const stream = await requestMediaStream(DEFAULT_AUDIO_CONSTRAINTS);
  type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const dispatcher = createNoiseDispatcher();
  const buffer = new Float32Array(analyser.fftSize);
  /*
   * Cada leitura cobre `fftSize / sampleRate` de audio: 2048 amostras dao
   * ~43ms a 48kHz e ~46ms a 44.1kHz. Com o intervalo em 100ms observava-se
   * menos da metade da linha do tempo, o que inventava vales que nao existiam
   * na sala e deixava um estalo curto passar inteiro entre duas leituras — os
   * dois erros que mais atrapalham um criterio baseado em fracao da janela.
   * 40ms fecha a cobertura nas duas taxas comuns.
   */
  const pollingInterval = 40; // ms
  let rafId: number | null = null;

  function sample() {
    analyser.getFloatTimeDomainData(buffer);
    // RMS amplitude of the current window (0..1)
    let sum = 0;
    for (const v of buffer) {
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buffer.length);
    dispatcher.dispatch(rms);
    rafId = window.setTimeout(sample, pollingInterval) as unknown as number;
  }

  // start sampling
  sample();

  return {
    onNoiseAbove: dispatcher.onNoiseAbove,
    subscribeLevel: dispatcher.subscribeLevel,
    getCurrentLevel: dispatcher.getCurrentLevel,
    async stop() {
      if (rafId !== null) {
        clearTimeout(rafId as unknown as number);
        rafId = null;
      }
      try {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      } catch {}
      try {
        await audioCtx.close();
      } catch {}
    },
  };
}
