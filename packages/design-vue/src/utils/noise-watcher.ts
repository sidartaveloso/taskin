type NoiseCallback = () => void;
type NoiseLevelCallback = (rms: number) => void;

export interface NoiseWatcher {
  onNoiseAbove: (
    threshold: number,
    cb: NoiseCallback,
    debounceMs?: number,
  ) => () => void;
  subscribeLevel: (cb: NoiseLevelCallback) => () => void;
  getCurrentLevel: () => number;
  stop: () => Promise<void>;
}

export async function createNoiseWatcher(): Promise<NoiseWatcher> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Web Audio API not supported or no microphone access');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  let rafId: number | null = null;
  let pollingInterval = 100; // ms
  let lastRms = 0;

  const levelListeners: Set<NoiseLevelCallback> = new Set();

  const listeners: Set<{
    threshold: number;
    cb: NoiseCallback;
    debounceMs: number;
    lastFired: number;
  }> = new Set();

  const buffer = new Float32Array(analyser.fftSize);

  function sample() {
    analyser.getFloatTimeDomainData(buffer);
    // RMS
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer[i];
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buffer.length);

    const now = Date.now();
    lastRms = rms;
    for (const cb of levelListeners) {
      try {
        cb(rms);
      } catch {}
    }
    for (const l of listeners) {
      if (rms >= l.threshold) {
        if (now - l.lastFired > l.debounceMs) {
          l.lastFired = now;
          try {
            l.cb();
          } catch (e) {
            // ignore
          }
        }
      }
    }

    rafId = window.setTimeout(sample, pollingInterval) as unknown as number;
  }

  // start
  sample();

  return {
    onNoiseAbove(threshold: number, cb: NoiseCallback, debounceMs = 1500) {
      const listener = { threshold, cb, debounceMs, lastFired: 0 };
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeLevel(cb: NoiseLevelCallback) {
      levelListeners.add(cb);
      // provide immediate value
      try {
        cb(lastRms);
      } catch {}
      return () => levelListeners.delete(cb);
    },
    getCurrentLevel() {
      return lastRms;
    },
    async stop() {
      if (rafId !== null) {
        clearTimeout(rafId as unknown as number);
        rafId = null;
      }
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        await audioCtx.close();
      } catch {}
    },
  };
}
