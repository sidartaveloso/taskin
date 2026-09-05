import { vi } from 'vitest';
import { defineComponent, h, type PropType, ref } from 'vue';
import type { FaceTrackingDebugProps } from '../components/molecules/face-tracking-debug/FaceTrackingDebug.types';
import type { NoiseTrackingControlsProps } from '../components/molecules/noise-tracking-controls/NoiseTrackingControls.types';
import type { TrackingControlsProps } from '../components/molecules/tracking-controls/TrackingControls.types';
import type { NoiseWatcher } from '../utils/noise-watcher';

export { defaultFunctions } from '../components/organisms/gesture-system/GestureSystem.types';

// Utils puros nao tem o que stubar — reexportados como sao, para o modulo
// mockado continuar sendo substituto completo do real
export * from '../utils/arm-angle';

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

export const WebcamVideo = defineComponent({
  name: 'WebcamVideo',
  props: {
    visible: { type: Boolean, default: false },
    width: { type: Number, default: 320 },
    height: { type: Number, default: 240 },
    mirrored: { type: Boolean, default: true },
  },
  setup(props, { expose }) {
    const videoElement = ref<HTMLVideoElement | null>(null);
    expose({ videoElement });
    return () =>
      h('video', {
        ref: videoElement,
        class: ['webcam-video', { visible: props.visible, mirrored: props.mirrored }],
        'data-testid': 'mock-webcam-video',
        autoplay: true,
        playsinline: true,
      });
  },
});

export const TrackingControls = defineComponent({
  name: 'TrackingControls',
  props: {
    isDetecting: { type: Boolean, default: false },
    error: { type: String as PropType<TrackingControlsProps['error']>, default: null },
    showWebcam: { type: Boolean, default: false },
    syncEyes: { type: Boolean, default: false },
    syncMouth: { type: Boolean, default: false },
    syncExpressions: { type: Boolean, default: false },
    syncArms: { type: Boolean, default: false },
    syncGestures: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: [
    'toggle-tracking',
    'update:showWebcam',
    'update:syncEyes',
    'update:syncMouth',
    'update:syncExpressions',
    'update:syncArms',
    'update:syncGestures',
  ],
  setup(props, { emit }) {
    const onToggle = () => emit('toggle-tracking');
    const onShowWebcam = (event: Event) => emit('update:showWebcam', (event.target as HTMLInputElement).checked);
    const onSync =
      (
        event:
          | 'update:syncEyes'
          | 'update:syncMouth'
          | 'update:syncExpressions'
          | 'update:syncArms'
          | 'update:syncGestures',
      ) =>
      (input: Event) =>
        emit(event, (input.target as HTMLInputElement).checked);

    return () =>
      h('div', { class: 'mock-tracking-controls' }, [
        h(
          'button',
          {
            type: 'button',
            'data-testid': 'mock-toggle-tracking',
            disabled: props.disabled,
            onClick: onToggle,
          },
          props.isDetecting ? 'Parar Detecção' : 'Iniciar Detecção',
        ),
        h('label', { class: 'mock-control-label' }, [
          h('input', {
            type: 'checkbox',
            'data-testid': 'mock-show-webcam',
            checked: props.showWebcam,
            onChange: onShowWebcam,
          }),
          'Show webcam',
        ]),
        h('label', { class: 'mock-control-label' }, [
          h('input', {
            type: 'checkbox',
            'data-testid': 'mock-sync-eyes',
            checked: props.syncEyes,
            onChange: onSync('update:syncEyes'),
          }),
          'Sync eyes',
        ]),
      ]);
  },
});

export const FaceTrackingDebug = defineComponent({
  name: 'FaceTrackingDebug',
  props: {
    data: { type: Object as PropType<FaceTrackingDebugProps['data']>, default: null },
    title: { type: String, default: 'Debug Info' },
    position: { type: String as PropType<FaceTrackingDebugProps['position']>, default: 'top-right' },
  },
  setup(props) {
    return () =>
      props.data
        ? h(
            'div',
            { class: 'mock-face-tracking-debug', 'data-testid': 'mock-face-tracking-debug' },
            String(props.title),
          )
        : null;
  },
});

export const NoiseTrackingControls = defineComponent({
  name: 'NoiseTrackingControls',
  props: {
    isActive: { type: Boolean, default: false },
    error: { type: String as PropType<NoiseTrackingControlsProps['error']>, default: null },
    enableNoiseReactions: { type: Boolean, default: false },
    noiseThreshold: { type: Number, default: 0.06 },
    noiseDebounceMs: { type: Number, default: 1500 },
    noiseSound: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: [
    'toggle-noise',
    'update:enableNoiseReactions',
    'update:noiseThreshold',
    'update:noiseDebounceMs',
    'update:noiseSound',
  ],
  setup(props, { emit }) {
    const onToggleNoise = () => emit('toggle-noise');
    const onBool = (event: 'update:enableNoiseReactions' | 'update:noiseSound') => (input: Event) =>
      emit(event, (input.target as HTMLInputElement).checked);

    return () =>
      h('div', { class: 'mock-noise-tracking-controls' }, [
        h(
          'button',
          { type: 'button', 'data-testid': 'mock-toggle-noise', disabled: props.disabled, onClick: onToggleNoise },
          props.isActive ? 'Parar Ruído' : 'Iniciar Ruído',
        ),
        h('label', { class: 'mock-control-label' }, [
          h('input', {
            type: 'checkbox',
            'data-testid': 'mock-enable-noise-reactions',
            checked: props.enableNoiseReactions,
            onChange: onBool('update:enableNoiseReactions'),
          }),
          'Enable noise reactions',
        ]),
      ]);
  },
});

export const GestureIcon = defineComponent({
  name: 'GestureIcon',
  props: {
    gesture: { type: String, default: 'None' },
    size: { type: Number, default: 24 },
  },
  setup: () => () => h('span', { 'data-testid': 'mock-gesture-icon' }),
});

export const GestureLegend = defineComponent({
  name: 'GestureLegend',
  props: {
    mappings: { type: Array, default: () => [] },
  },
  setup: () => () => h('div', { 'data-testid': 'mock-gesture-legend' }),
});

export const GestureWizard = defineComponent({
  name: 'GestureWizard',
  props: {
    userId: { type: String, default: 'default' },
  },
  setup: () => () => h('div', { 'data-testid': 'mock-gesture-wizard' }),
});

export const GestureSystem = defineComponent({
  name: 'GestureSystem',
  props: {
    enabled: { type: Boolean, default: true },
  },
  setup: () => () => h('div', { 'data-testid': 'mock-gesture-system' }),
});

// ---------------------------------------------------------------------------
// Composables (same names and signatures as the originals, controllable)
// ---------------------------------------------------------------------------

export {
  createElementTrackingMock,
  useElementTracking,
} from '../composables/use-element-tracking/use-element-tracking.mock';
export { createEyeTrackingMock, useEyeTracking } from '../composables/use-eye-tracking/use-eye-tracking.mock';
export {
  createFaceLandmarkerMock,
  useFaceLandmarker,
} from '../composables/use-face-landmarker/use-face-landmarker.mock';
export {
  createGestureRecognizerMock,
  useGestureRecognizer,
} from '../composables/use-gesture-recognizer/use-gesture-recognizer.mock';
export {
  createGestureShortcutsMock,
  useGestureShortcuts,
} from '../composables/use-gesture-shortcuts/use-gesture-shortcuts.mock';
export { createMouseTrackingMock, useMouseTracking } from '../composables/use-mouse-tracking/use-mouse-tracking.mock';
export {
  createPoseLandmarkerMock,
  usePoseLandmarker,
} from '../composables/use-pose-landmarker/use-pose-landmarker.mock';

// ---------------------------------------------------------------------------
// Noise watcher
// ---------------------------------------------------------------------------

export const createNoiseWatcher = vi.fn(
  async (): Promise<NoiseWatcher> => ({
    onNoiseAbove: vi.fn(() => () => undefined),
    subscribeLevel: vi.fn(() => () => undefined),
    getCurrentLevel: vi.fn(() => 0),
    stop: vi.fn(async () => undefined),
  }),
);
