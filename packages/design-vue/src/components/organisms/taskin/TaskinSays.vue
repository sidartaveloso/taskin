<template>
  <div class="taskin-says" :class="attrsClass" :style="[rootStyle, attrsStyle]">
    <Taskin
      ref="taskinRef"
      v-bind="taskinAttrs"
      :size="size"
      :character="character"
      :animations-enabled="animationsEnabled"
      :show-thought-bubble="text ? false : undefined"
    />
    <SpeechBubble
      v-if="text"
      class="taskin-says__bubble"
      role="status"
      data-testid="taskin-says-bubble"
      tail="left"
      :text="text"
      :animated="animationsEnabled"
      :max-width="maxWidth"
      :background="bubbleBackground"
      :border-color="bubbleBorderColor"
      :text-color="bubbleTextColor"
      :border-width="bubbleBorderWidth"
      :font-size="bubbleFontSize"
      :kind="bubbleKind"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * O balao de fala em HTML, fora do SVG do mascote.
 *
 * O balao em SVG (`speechText`, task-166) vive dentro do quadro de 320x260 e
 * escala junto com o desenho: a 180px, o tamanho do chat, o texto sai com uns
 * 6px e nao se le. Aqui o balao e o atomo `SpeechBubble`, ancorado ao
 * desenho, com texto em pixels de verdade e quebra de linha natural. As cores
 * vem das props `bubble*` ou das variaveis `--speech-bubble-*` herdadas; sem
 * nenhuma das duas, a borda segue a tinta da personagem. O SVG continua para
 * renders isolados.
 */
import { computed, ref, type StyleValue, useAttrs } from 'vue';
import { speechBubbleTailDrop, speechBubbleTailReach } from '../../atoms/speech-bubble/SpeechBubble.types';
import SpeechBubble from '../../atoms/speech-bubble/SpeechBubble.vue';
import { TASKIN_CHARACTER } from './characters/taskin/taskin-character';
import Taskin from './Taskin';
import type { TaskinAction } from './Taskin.actions';
import type { TaskinSaysProps } from './TaskinSays.types';

defineOptions({ name: 'TaskinSays', inheritAttrs: false });

const props = withDefaults(defineProps<TaskinSaysProps>(), {
  text: '',
  size: 340,
  character: () => TASKIN_CHARACTER,
  animationsEnabled: true,
  maxWidth: 260,
  bubbleBackground: undefined,
  bubbleBorderColor: undefined,
  bubbleTextColor: undefined,
  bubbleBorderWidth: undefined,
  bubbleFontSize: undefined,
  bubbleKind: 'speech',
});

const attrs = useAttrs();
// `class` e `style` ficam na raiz; o resto atravessa para o `Taskin`.
const attrsClass = computed(() => attrs.class as string | undefined);
const attrsStyle = computed(() => attrs.style as StyleValue);
const taskinAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});

/*
 * Onde a ponta do rabicho encosta, no quadro de 320 do mascote: um pouco a
 * direita da beira da cabeca da personagem (`character.bubbles.headRight`), na
 * altura da ponta. O quadro tem uma margem vazia a direita do bicho, entao o
 * balao entra nela em vez de nascer depois dela.
 */
/** A altura, no quadro de 260, em que a ponta encosta: o meio da cabeca, abaixo dos olhos. */
const HEAD_LEVEL = 100;
/*
 * O balao entra na margem vazia do quadro o quanto o rabicho alcanca, e desce
 * ate a ponta ficar na altura da cabeca; num mascote muito pequeno (abaixo de
 * ~110px) ele para no topo e a ponta fica um pouco abaixo. O alcance depende
 * da espessura da borda, por isso vem do proprio atomo.
 */
const rootStyle = computed(() => ({
  '--taskin-says-bubble-top': `${Math.max(0, Math.round((props.size * HEAD_LEVEL) / 320 - speechBubbleTailDrop(undefined, props.bubbleBorderWidth)))}px`,
  '--taskin-says-bubble-offset': `${Math.round(speechBubbleTailReach(props.bubbleBorderWidth) - (props.size * (320 - props.character.bubbles.headRight)) / 320)}px`,
  // A tinta da personagem entra como o padrao do tema: uma prop, ou a variavel
  // posta por quem envolve (pelo `style`, que vem depois), ganha dela.
  '--speech-bubble-border-color': props.character.mouth.ink,
}));

const taskinRef = ref<{ play: (action: TaskinAction) => Promise<boolean> } | null>(null);

defineExpose({
  /** O `play` do `Taskin` de dentro, para o `useTaskinScript` e afins. */
  play: (action: TaskinAction): Promise<boolean> => taskinRef.value?.play(action) ?? Promise.resolve(false),
});
</script>

<style scoped>
.taskin-says {
  display: inline-flex;
  align-items: flex-start;
}

.taskin-says__bubble {
  flex: 0 0 auto;
  margin-top: var(--taskin-says-bubble-top, 48px);
  /* Negativo: entra na margem vazia do quadro ate a ponta do rabicho encostar na cabeca. */
  margin-left: var(--taskin-says-bubble-offset, 0px);
}
</style>
