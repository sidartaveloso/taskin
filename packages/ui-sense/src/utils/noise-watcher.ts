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
  /** Tempo continuo acima do limiar exigido antes de disparar, em ms. */
  sustainMs?: number;
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

interface ThresholdListener {
  threshold: number;
  cb: NoiseCallback;
  debounceMs: number;
  sustainMs: number;
  lastFired: number;
  /** Instante da primeira amostra da sequencia alta atual; `null` fora dela. */
  aboveSince: number | null;
}

const resolveTiming = (timing: NoiseThresholdTiming | undefined): { debounceMs: number; sustainMs: number } => {
  if (typeof timing === 'number') {
    return { debounceMs: timing, sustainMs: DEFAULT_NOISE_SUSTAIN_MS };
  }
  return {
    debounceMs: timing?.debounceMs ?? DEFAULT_NOISE_DEBOUNCE_MS,
    sustainMs: timing?.sustainMs ?? DEFAULT_NOISE_SUSTAIN_MS,
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
      const { debounceMs, sustainMs } = resolveTiming(timing);
      // Start in the distant past so the first sample above the threshold fires
      // regardless of where the clock happens to start.
      const listener: ThresholdListener = {
        threshold,
        cb,
        debounceMs,
        sustainMs,
        lastFired: Number.NEGATIVE_INFINITY,
        aboveSince: null,
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
        if (rms < l.threshold) {
          // Uma unica amostra baixa desfaz o acumulo: a sustentacao e continua,
          // e nao uma fracao da janela. E o criterio que da para explicar —
          // "ficou alto por X segundos seguidos" — e o mais barato de testar.
          l.aboveSince = null;
          continue;
        }
        l.aboveSince ??= now;
        const sustained = now - l.aboveSince >= l.sustainMs;
        // O debounce conta do disparo, nao do inicio do barulho: os dois tempos
        // sao independentes e podem ser lidos separados.
        if (sustained && now - l.lastFired > l.debounceMs) {
          l.lastFired = now;
          try {
            l.cb();
          } catch {}
        }
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
  const pollingInterval = 100; // ms
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
