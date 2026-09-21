<template>
  <div class="taskin-shhh-tracking">
    <WebcamVideo
      ref="webcamVideoRef"
      :visible="showWebcam"
      :width="320"
      :height="240"
      :mirrored="true"
    />

    <TrackingControls
      v-if="showControls"
      :controls="['webcam', 'eyes', 'mouth', 'expressions']"
      :is-detecting="faceLandmarker.state.value.isDetecting"
      :error="faceLandmarker.state.value.error"
      :show-webcam="showWebcam"
      :sync-eyes="syncEyes"
      :sync-mouth="syncMouth"
      :sync-expressions="syncExpressions"
      @toggle-tracking="toggleTracking"
      @update:show-webcam="showWebcam = $event"
      @update:sync-eyes="syncEyes = $event"
      @update:sync-mouth="syncMouth = $event"
      @update:sync-expressions="syncExpressions = $event"
    />

    <NoiseTrackingControls
      v-if="showControls"
      :is-active="!!noiseWatcher"
      :enable-noise-reactions="enableNoiseReactionsRef"
      :noise-threshold="noiseThresholdRef"
      :noise-debounce-ms="noiseDebounceMsRef"
      :noise-sustain-ms="noiseSustainMsRef"
      :noise-sustain-ratio="noiseSustainRatioRef"
      :noise-sound="noiseSoundRef"
      @toggle-noise="toggleNoise"
      @update:enable-noise-reactions="setEnableNoiseReactions"
      @update:noise-threshold="setNoiseThreshold"
      @update:noise-debounce-ms="setNoiseDebounceMs"
      @update:noise-sustain-ms="setNoiseSustainMs"
      @update:noise-sustain-ratio="setNoiseSustainRatio"
      @trigger-shhh="triggerShhhReaction"
      @update:noise-sound="setNoiseSound"
    />

    <div class="mascot-container" ref="mascotContainer">
      <Taskin
        :mood="currentMood"
        :size="mascotSize"
        :eye-tracking-mode="eyeTrackingMode"
        :eye-custom-position="eyePosition"
        :eye-state="eyeState"
        :mouth-expression="mouthExpression"
        :animations-enabled="true"
        :show-thought-bubble="showThoughtBubble"
        :thought-bubble-text="thoughtBubbleText"
      />
    </div>

    <FaceTrackingDebug
      v-if="showDebug"
      :data="debugInfo"
      title="Shhh Detection"
      position="top-right"
    />
  </div>
</template>

<script setup lang="ts">
import { type MascotConfigInput, resolveMascotNoiseSettings, resolveShhhReactionPlan } from '@opentask/taskin-types';
import {
  createNoiseWatcher,
  criarVozDoShhhDoNavegador,
  FaceTrackingDebug,
  type NoiseProgress,
  NoiseTrackingControls,
  TrackingControls,
  useFaceLandmarker,
  WebcamVideo,
} from '@opentask/ui-sense';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Taskin from './Taskin';
import type { TaskinMood } from './Taskin.types';

export interface Props {
  mascotSize?: number;
  showWebcam?: boolean;
  showDebug?: boolean;
  /**
   * Mostra os controles de rastreamento e de ruido em volta do mascote. Ligados
   * por padrao, que e o uso de laboratorio — no Storybook e onde se mexe neles.
   * Desligados, sobra so o mascote: e assim que ele vive num celular apoiado
   * abaixo do monitor, onde nao ha nada a ajustar durante o dia.
   */
  showControls?: boolean;
  /**
   * The `mascot` block from `.taskin.json`. When provided, its
   * `reactions.noise` settings seed the noise reaction and take precedence over
   * the individual `noise*` props below, so a consumer can wire config straight
   * through without unpacking it first.
   */
  mascot?: MascotConfigInput;
  // noise reaction props (used when `mascot` is not provided)
  enableNoiseReactions?: boolean;
  noiseThreshold?: number; // RMS threshold (0..1)
  noiseDebounceMs?: number;
  /**
   * Janela em que o ruido e medido antes do primeiro disparo, em ms. Zero — o
   * padrao — dispara na primeira amostra alta. Um estalo de porta e um minuto
   * de conversa alta so deixam de valer o mesmo quando isto e maior que zero.
   */
  noiseSustainMs?: number;
  /**
   * Fracao dessa janela que precisa estar acima do limiar, de 0 a 1. Uma fala
   * tem vales de 100 a 400ms entre palavras, entao exigir barulho ininterrupto
   * (fracao 1) nunca dispara numa conversa.
   */
  noiseSustainRatio?: number;
  noiseSound?: boolean;
  /**
   * Quem o mascote chama. E a unica parte que a sintese de voz pronuncia: sai
   * "Bruno," — pausa — e so entao o chiado, no ritmo de uma frase falada.
   * Vazio: o mascote so chia, sem endereco.
   */
  shhhName?: string;
  /**
   * O que aparece no balao depois do nome, e de onde sai a duracao do chiado.
   * Quem escreve mais `h` esta pedindo mais silencio.
   *
   * Nao e falado: mandar o `speechSynthesis` pronunciar "Shhhhhhhhhhhh..." dava
   * um arrastado sem sentido por cima do chiado sintetizado, que e quem sabe
   * fazer esse som.
   */
  shhhPhrase?: string;
  /** Loudness of the spoken reaction, 0..1. Loud by default — the room has to hear it. */
  shhhVolume?: number;
}

const props = withDefaults(defineProps<Props>(), {
  mascotSize: 300,
  showWebcam: false,
  showDebug: false,
  showControls: true,
  enableNoiseReactions: false,
  noiseThreshold: 0.06,
  noiseDebounceMs: 1500,
  noiseSustainMs: 0,
  noiseSustainRatio: 0.6,
  noiseSound: false,
  shhhName: '',
  shhhPhrase: 'Shhhhhh...',
  shhhVolume: 1,
});

// Resolve the effective noise settings: the `mascot` config block wins when
// present, otherwise fall back to the individual props (already defaulted).
const noiseSettings = computed(() =>
  props.mascot
    ? resolveMascotNoiseSettings(props.mascot)
    : {
        enabled: props.enableNoiseReactions,
        threshold: props.noiseThreshold,
        debounceMs: props.noiseDebounceMs,
        sustainMs: props.noiseSustainMs,
        sustainRatio: props.noiseSustainRatio,
        sound: props.noiseSound,
        name: props.shhhName,
        phrase: props.shhhPhrase,
        volume: props.shhhVolume,
      },
);

const webcamVideoRef = ref<{ videoElement: HTMLVideoElement | null } | null>(null);
const mascotContainer = ref<HTMLDivElement | null>(null);
const showWebcam = ref(props.showWebcam);
const syncEyes = ref(true);
const syncMouth = ref(true);
const syncExpressions = ref(true);

const videoElement = ref<HTMLVideoElement | null>(null);
onMounted(() => {
  if (webcamVideoRef.value) videoElement.value = webcamVideoRef.value.videoElement;
});

const faceLandmarker = useFaceLandmarker(videoElement, {
  enableBlendshapes: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  mirrorEyeTracking: true,
});

const currentMood = ref<TaskinMood>('neutral');
const eyeTrackingMode = ref<'none' | 'mouse' | 'element' | 'custom'>('none');
const eyePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const eyeState = ref<'normal' | 'closed' | 'squint' | 'wide'>('normal');
const mouthExpression = ref<'neutral' | 'smile' | 'frown' | 'open' | 'wide-open' | 'o-shape' | 'smirk' | 'surprised'>(
  'neutral',
);

const showThoughtBubble = ref(false);
const thoughtBubbleText = ref<string>('');

const mascotSize = ref(props.mascotSize);

// local noise config mirrors the resolved settings and is editable by child control
const enableNoiseReactionsRef = ref<boolean>(noiseSettings.value.enabled);
const noiseThresholdRef = ref<number>(noiseSettings.value.threshold);
const noiseDebounceMsRef = ref<number>(noiseSettings.value.debounceMs);
const noiseSustainMsRef = ref<number>(noiseSettings.value.sustainMs);
const noiseSustainRatioRef = ref<number>(noiseSettings.value.sustainRatio);
const noiseSoundRef = ref<boolean>(noiseSettings.value.sound);
const shhhPhraseRef = ref<string>(noiseSettings.value.phrase);
const shhhNameRef = ref<string>(noiseSettings.value.name);

/** O balao mostra a frase inteira; a voz so pronuncia o nome. */
const shhhFraseCompleta = computed(() =>
  shhhNameRef.value.trim() ? `${shhhNameRef.value.trim()}, ${shhhPhraseRef.value}` : shhhPhraseRef.value,
);
const shhhVolumeRef = ref<number>(noiseSettings.value.volume);

// A voz so existe no navegador, e so e montada uma vez: o contexto de audio
// dela e caro e o navegador limita quantos podem ser abertos.
let voz: ReturnType<typeof criarVozDoShhhDoNavegador> = null;

const toggleTracking = () => {
  if (faceLandmarker.state.value.isDetecting) faceLandmarker.stopDetection();
  else faceLandmarker.startDetection();
};

// Noise watcher
let noiseWatcher: Awaited<ReturnType<typeof createNoiseWatcher>> | null = null;

/**
 * Estado do criterio na ultima amostra, para o painel de debug. Fica nulo
 * quando nao ha inscricao: melhor um campo vazio do que um numero parado que
 * parece atual.
 */
const noiseProgress = ref<NoiseProgress | null>(null);
let noiseUnsub: (() => void) | null = null;

// Read the OS/browser reduced-motion preference at reaction time so the mascot
// falls back to a static badge instead of the animation when motion is reduced.
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const triggerShhhReaction = () => {
  const plan = resolveShhhReactionPlan({
    sound: noiseSoundRef.value,
    prefersReducedMotion: prefersReducedMotion(),
  });

  // Both branches surface the "shh" bubble; only the animated branch moves the
  // mouth/mood, so the reduced-motion fallback stays a static badge.
  showThoughtBubble.value = true;
  thoughtBubbleText.value = shhhFraseCompleta.value;

  // O balao e para quem olha a tela; o som e para quem esta falando alto e nao
  // esta olhando. E por isso que o `sound` nao pode continuar sendo um
  // interruptor que nao faz nada.
  if (plan.playSound) {
    voz ??= criarVozDoShhhDoNavegador();
    void voz?.shush({
      name: shhhNameRef.value,
      phrase: shhhPhraseRef.value,
      volume: shhhVolumeRef.value,
    });
  }
  if (plan.animate) {
    mouthExpression.value = 'o-shape';
    currentMood.value = 'thoughtful';
  }

  setTimeout(() => {
    showThoughtBubble.value = false;
    thoughtBubbleText.value = '';
    mouthExpression.value = 'neutral';
    currentMood.value = 'neutral';
  }, 2000);
};

// setters used by child controls (avoid inline assignments in template)
function toggleNoise() {
  enableNoiseReactionsRef.value = !enableNoiseReactionsRef.value;
}

function setEnableNoiseReactions(v: boolean) {
  enableNoiseReactionsRef.value = v;
}

function setNoiseThreshold(v: number) {
  noiseThresholdRef.value = v;
}

function setNoiseDebounceMs(v: number) {
  noiseDebounceMsRef.value = v;
}

function setNoiseSustainMs(v: number) {
  noiseSustainMsRef.value = v;
}

function setNoiseSustainRatio(v: number) {
  noiseSustainRatioRef.value = v;
}

function setNoiseSound(v: boolean) {
  noiseSoundRef.value = v;
}

watch(syncEyes, (enabled) => {
  if (enabled && faceLandmarker.state.value.isDetecting) eyeTrackingMode.value = 'custom';
});

watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes || !mascotContainer.value) return;
    if (!syncEyes.value) return;

    eyeTrackingMode.value = 'custom';

    const eyeLook = faceLandmarker.getEyeLookDirection();
    const mascotRect = mascotContainer.value.getBoundingClientRect();
    const mascotCenterX = mascotRect.left + mascotRect.width / 2;
    const mascotCenterY = mascotRect.top + mascotRect.height / 2;

    eyePosition.value = {
      x: mascotCenterX + eyeLook.x * 3,
      y: mascotCenterY + eyeLook.y * 3,
    };

    const eyeOpenness = faceLandmarker.getEyeOpenness();
    const avgOpenness = (eyeOpenness.left + eyeOpenness.right) / 2;

    if (faceLandmarker.isEyesWide()) eyeState.value = 'wide';
    else if (avgOpenness < 0.3) eyeState.value = 'closed';
    else if (avgOpenness < 0.6) eyeState.value = 'squint';
    else eyeState.value = 'normal';
  },
);

// Shhh detection: simple heuristic using mouth openness and low smile/frown
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes) return;
    if (!syncMouth.value && !syncExpressions.value) return;

    const mouthOpenness = faceLandmarker.getMouthOpenness();
    const smile = faceLandmarker.getSmileIntensity();
    const frown = faceLandmarker.getFrownIntensity();

    // Heuristic: very closed mouth + low smile/frown => possible shhh (finger-to-lips not required)
    const shhhDetected = mouthOpenness < 0.12 && smile < 0.2 && frown < 0.2;

    if (shhhDetected) {
      triggerShhhReaction();
    }
  },
);

/**
 * (Re)inscreve a reacao com os tempos atuais. Existe em um lugar so de proposito:
 * os controles editam limiar, debounce e sustentacao ao vivo, e quando cada um
 * tinha o seu proprio watcher repetindo a chamada, bastava um parametro novo
 * para um deles ficar para tras.
 */
const subscribeToNoise = () => {
  if (!noiseWatcher) return;
  if (noiseUnsub) {
    try {
      noiseUnsub();
    } catch {}
  }
  noiseUnsub = noiseWatcher.onNoiseAbove(noiseThresholdRef.value, () => triggerShhhReaction(), {
    debounceMs: noiseDebounceMsRef.value,
    sustainMs: noiseSustainMsRef.value,
    sustainRatio: noiseSustainRatioRef.value,
    onProgress: (p) => {
      noiseProgress.value = p;
    },
  });
};

onMounted(async () => {
  if (enableNoiseReactionsRef.value) {
    try {
      noiseWatcher = await createNoiseWatcher();
      subscribeToNoise();
      // also subscribe to level updates
      noiseLevelUnsubLocal = noiseWatcher.subscribeLevel((rms: number) => {
        noiseLevel.value = rms;
      });
    } catch (e) {
      // ignore
    }
  }
});

onUnmounted(async () => {
  if (noiseUnsub) {
    try {
      noiseUnsub();
    } catch {}
    noiseUnsub = null;
    noiseProgress.value = null;
  }
  if (noiseWatcher) {
    try {
      await noiseWatcher.stop();
    } catch {}
    noiseWatcher = null;
  }
});

// react to local noise config changes
watch(enableNoiseReactionsRef, async (v) => {
  if (v) {
    if (!noiseWatcher) {
      try {
        noiseWatcher = await createNoiseWatcher();
        subscribeToNoise();
        noiseLevelUnsubLocal = noiseWatcher.subscribeLevel((rms: number) => (noiseLevel.value = rms));
      } catch {}
    }
  } else {
    if (noiseUnsub) {
      try {
        noiseUnsub();
      } catch {}
      noiseUnsub = null;
      noiseProgress.value = null;
      noiseProgress.value = null;
    }
    if (noiseWatcher) {
      try {
        await noiseWatcher.stop();
      } catch {}
      noiseWatcher = null;
    }
  }
});

watch([noiseThresholdRef, noiseDebounceMsRef, noiseSustainMsRef, noiseSustainRatioRef], () => {
  if (noiseUnsub && noiseWatcher) subscribeToNoise();
});

const noiseLevel = ref<number | null>(null);
let noiseLevelUnsubLocal: (() => void) | null = null;

/** Segundos com uma casa: no painel o numero muda a cada 40ms e precisa parar quieto. */
const emSegundos = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/**
 * O pedido era um relogio regressivo desde o inicio do barulho. Ele nao existe
 * neste criterio: o disparo depende da ocupacao dos ultimos segundos, entao uma
 * pausa longa AUMENTA o tempo que falta. O que da para mostrar sem mentir e o
 * estado do criterio — e uma previsao dita como previsao.
 */
const noiseCountdown = computed(() => {
  const p = noiseProgress.value;
  if (!p) return { occupancy: null, windowFull: null, debounce: null, firesIn: null };

  return {
    occupancy: `${Math.round(p.ratio * 100)}% / ${Math.round(p.requiredRatio * 100)}%`,
    windowFull: p.msUntilWindowFull > 0 ? emSegundos(p.msUntilWindowFull) : 'ok',
    debounce: p.msUntilDebounceOver > 0 ? emSegundos(p.msUntilDebounceOver) : 'livre',
    firesIn:
      p.msUntilFire === null ? '?' : p.msUntilFire === 0 ? 'agora' : `${emSegundos(p.msUntilFire)} (se continuar)`,
  };
});

const debugInfo = computed(() => {
  const bs = faceLandmarker.state.value.blendShapes;
  return {
    smile: bs ? faceLandmarker.getSmileIntensity().toFixed(2) : null,
    frown: bs ? faceLandmarker.getFrownIntensity().toFixed(2) : null,
    mouthOpen: bs ? faceLandmarker.getMouthOpenness().toFixed(2) : null,
    mouthExpression: mouthExpression.value,
    eyeLook: bs
      ? (() => {
          const eyeLook = faceLandmarker.getEyeLookDirection();
          return { x: eyeLook.x.toFixed(2), y: eyeLook.y.toFixed(2) };
        })()
      : null,
    eyeOpenness: bs
      ? (() => {
          const eyeOpenness = faceLandmarker.getEyeOpenness();
          return {
            left: eyeOpenness.left.toFixed(2),
            right: eyeOpenness.right.toFixed(2),
          };
        })()
      : null,
    noise: {
      enabled: enableNoiseReactionsRef.value,
      level: noiseLevel.value !== null ? noiseLevel.value.toFixed(4) : null,
      threshold: noiseThresholdRef.value,
      debounceMs: noiseDebounceMsRef.value,
      sustainMs: noiseSustainMsRef.value,
      sustainRatio: noiseSustainRatioRef.value,
      microphoneAvailable: !!noiseWatcher,
      ...noiseCountdown.value,
    },
  };
});

// subscribe to level updates when noise watcher available
onMounted(() => {
  if (noiseWatcher && enableNoiseReactionsRef.value) {
    noiseLevelUnsubLocal = noiseWatcher.subscribeLevel((rms: number) => {
      noiseLevel.value = rms;
    });
  }
});

onUnmounted(() => {
  if (noiseLevelUnsubLocal) {
    try {
      noiseLevelUnsubLocal();
    } catch {}
    noiseLevelUnsubLocal = null;
  }
});
</script>

<script lang="ts">
export default {
  name: 'TaskinWithShhh',
};
</script>

<style scoped>
.taskin-shhh-tracking {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.mascot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
