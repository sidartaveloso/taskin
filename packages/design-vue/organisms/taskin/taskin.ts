import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type PropType,
  type SetupContext,
} from 'vue';
import { createTaskinController } from './taskin.controller';
import svgRaw from './taskin.svg?raw';
import type {
  TaskinController,
  TaskinExpose,
  TaskinProps,
  TaskinReadyPayload,
} from './taskin.types';

export default defineComponent({
  name: 'TaskinMascot',
  props: {
    size: {
      type: Number as PropType<number>,
      default: 220,
    },
    mood: {
      type: String as PropType<TaskinProps['mood']>,
      default: 'sarcastic',
    },
    idleAnimation: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    animationsEnabled: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
  },
  emits: ['ready'],
  setup(props, { emit, expose }: SetupContext<['ready']>) {
    const containerRef = ref<HTMLElement | null>(null);
    const svgContent = ref<string>(svgRaw);
    const controllerRef = ref<TaskinController | null>(null);
    const idleTimer = ref<number | null>(null);

    const animationsEnabled = () => !!props.animationsEnabled;

    const setupIdleAnimation = () => {
      if (!props.idleAnimation || !animationsEnabled()) return;
      if (idleTimer.value !== null) return;

      idleTimer.value = window.setInterval(() => {
        if (!animationsEnabled() || !controllerRef.value) return;
        const chance = Math.random();
        if (chance < 0.3) controllerRef.value.blink();
        else if (chance < 0.5) controllerRef.value.wiggleAllTentacles();
        else if (chance < 0.7) controllerRef.value.sarcasticShrug();
      }, 3500);
    };

    onMounted(() => {
      const root = containerRef.value;
      if (!root) return;

      const svg = root.querySelector('svg');
      if (!svg) return;

      // set size respecting original ratio
      svg.setAttribute('width', String(props.size));
      svg.setAttribute('height', String((props.size! * 260) / 320));

      const controller = createTaskinController(
        svg as SVGElement,
        animationsEnabled,
      );
      controller.setMood(props.mood || 'sarcastic');

      controllerRef.value = controller;

      const payload: TaskinReadyPayload = {
        controller,
        rootSvg: svg as SVGElement,
      };

      emit('ready', payload);

      const exposed: TaskinExpose = {
        controller,
      };
      expose(exposed);

      setupIdleAnimation();
    });

    // Watch for prop changes and update component
    watch(
      () => props.size,
      (newSize) => {
        const root = containerRef.value;
        if (!root) return;
        const svg = root.querySelector('svg');
        if (!svg) return;
        svg.setAttribute('width', String(newSize));
        svg.setAttribute('height', String((newSize! * 260) / 320));
      },
    );

    watch(
      () => props.mood,
      (newMood) => {
        if (controllerRef.value && newMood) {
          controllerRef.value.setMood(newMood);
        }
      },
    );

    watch(
      () => props.idleAnimation,
      (newIdleAnimation) => {
        if (idleTimer.value !== null) {
          clearInterval(idleTimer.value);
          idleTimer.value = null;
        }
        if (newIdleAnimation) {
          setupIdleAnimation();
        }
      },
    );

    onUnmounted(() => {
      if (idleTimer.value !== null) {
        clearInterval(idleTimer.value);
        idleTimer.value = null;
      }
    });

    return () =>
      h('div', {
        ref: containerRef,
        class: 'taskin-mascot',
        innerHTML: svgContent.value,
        style: { display: 'inline-block' },
      });
  },
});
