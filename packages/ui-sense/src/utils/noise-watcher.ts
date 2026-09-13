import { DEFAULT_AUDIO_CONSTRAINTS, requestMediaStream } from './camera';

type NoiseCallback = () => void;
type NoiseLevelCallback = (rms: number) => void;

export interface NoiseWatcher {
  onNoiseAbove: (threshold: number, cb: NoiseCallback, debounceMs?: number) => () => void;
  subscribeLevel: (cb: NoiseLevelCallback) => () => void;
  getCurrentLevel: () => number;
  stop: () => Promise<void>;
}

/** Minimum gap between two reactions when a caller does not pass `debounceMs`. */
export const DEFAULT_NOISE_DEBOUNCE_MS = 1500;

interface ThresholdListener {
  threshold: number;
  cb: NoiseCallback;
  debounceMs: number;
  lastFired: number;
}

/**
 * The pure threshold/debounce/level core of the noise watcher, with no audio
 * dependency. `dispatch(rms, now)` feeds one amplitude sample in; the browser
 * audio sampler in {@link createNoiseWatcher} owns everything that needs a Web
 * Audio API. Splitting it out is what lets the debounce logic be unit-tested
 * with a fake clock instead of a real microphone.
 */
export interface NoiseDispatcher {
  onNoiseAbove: (threshold: number, cb: NoiseCallback, debounceMs?: number) => () => void;
  subscribeLevel: (cb: NoiseLevelCallback) => () => void;
  getCurrentLevel: () => number;
  dispatch: (rms: number, now?: number) => void;
}

export function createNoiseDispatcher(): NoiseDispatcher {
  const levelListeners = new Set<NoiseLevelCallback>();
  const listeners = new Set<ThresholdListener>();
  let lastRms = 0;

  return {
    onNoiseAbove(threshold: number, cb: NoiseCallback, debounceMs = DEFAULT_NOISE_DEBOUNCE_MS) {
      // Start in the distant past so the first sample above the threshold fires
      // regardless of where the clock happens to start.
      const listener: ThresholdListener = { threshold, cb, debounceMs, lastFired: Number.NEGATIVE_INFINITY };
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
        if (rms >= l.threshold && now - l.lastFired > l.debounceMs) {
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
