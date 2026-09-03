<template>
  <div
    class="progress-bar"
    :class="`progress-bar--${variant}`"
    role="progressbar"
    :aria-valuenow="percentage"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="accessibleName"
  >
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :class="`progress-bar__fill--${variant}`"
        :style="{ width: `${percentage}%` }"
      />

      <!--
        Duas copias do mesmo rotulo, no mesmo lugar, cada uma recortada na sua
        metade: a primeira no trecho sobre a trilha, a segunda no trecho sobre o
        preenchimento. Recortes complementares, entao nenhuma pinta em cima da
        outra — o axe reclamava de "background could not be determined" quando
        uma cobria a outra por inteiro.
        Cada copia so e renderizada se o seu lado existe: em 0% nao ha nada
        sobre o fill, em 100% nao ha nada sobre a trilha. Alem de enxugar o DOM,
        isso evita o axe avaliar contraste de texto recortado a zero.
        Ambas ficam fora da arvore de acessibilidade: o valor ja e anunciado por
        `aria-valuenow` e pelo nome acessivel.
      -->
      <template v-if="showLabel">
        <span
          v-if="percentage < 100"
          class="progress-bar__label-clip"
          :style="{ clipPath: `inset(0 0 0 ${percentage}%)` }"
          aria-hidden="true"
        >
          <span class="progress-bar__label">{{ percentage }}%</span>
        </span>
        <span
          v-if="percentage > 0"
          class="progress-bar__label-clip"
          :style="{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }"
          aria-hidden="true"
        >
          <span class="progress-bar__label progress-bar__label--on-fill">{{ percentage }}%</span>
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ProgressBarProps {
  percentage: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  /**
   * Nome acessivel da barra. Declarado como prop para que o pai escreva
   * `aria-label="..."` normalmente e o valor nao caia como atributo solto.
   * Nao tem relacao com `showLabel`, que controla apenas o rotulo visivel.
   */
  ariaLabel?: string;
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  variant: 'primary',
  showLabel: true,
  ariaLabel: undefined,
});

/**
 * Clamp percentage between 0 and 100.
 *
 * Precisa ser `computed`: a versao anterior lia `props.percentage` uma vez
 * durante o setup e guardava o numero. Como o nome local sombreia a prop no
 * template, a barra ficava congelada no valor inicial e nenhuma mudanca do pai
 * chegava a tela. Ver a story `ReactsToPropChange`.
 */
const percentage = computed(() => Math.min(100, Math.max(0, props.percentage)));

/**
 * O valor tambem chega a leitor de tela, entao `showLabel: false` passa a ser
 * uma escolha visual em vez de perda de informacao.
 */
const accessibleName = computed(() => props.ariaLabel ?? `Progresso: ${percentage.value}%`);
</script>

<style scoped>
@import '../../styles/variables.css';

.progress-bar {
  width: 100%;
}

.progress-bar__track {
  width: 100%;
  height: var(--progress-height);
  background-color: var(--bg-progress);
  border-radius: var(--radius-sm);
  overflow: hidden;
  /* Ancora do rotulo, que e posicionado sobre a trilha e nao dentro do fill */
  position: relative;
}

.progress-bar__fill {
  height: 100%;
  transition: width var(--transition-base);
}

.progress-bar__fill--primary {
  background: var(--status-progress-bg);
}

.progress-bar__fill--success {
  background: var(--status-success-bg);
}

.progress-bar__fill--warning {
  background: var(--status-paused-bg);
}

.progress-bar__fill--danger {
  background: var(--status-warning-bg);
}

/*
 * O rotulo fica centrado na trilha, nao dentro do fill.
 *
 * Antes era filho do fill, que e `width: ${percentage}%`. Em 0% o fill tinha
 * largura zero e centralizava um texto de 18px, que transbordava 9px para cada
 * lado; o `overflow: hidden` da trilha cortava a metade esquerda e sobrava um
 * "%" orfao na borda. Fora da caixa que muda de tamanho, isso nao acontece em
 * nenhum valor.
 */
.progress-bar__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family);
  white-space: nowrap;
  /* Sobre a trilha clara: 14.6:1. O branco de antes dava 1.44:1 aqui. */
  color: var(--text-primary);
}

/*
 * Cobre a trilha inteira para que as porcentagens do `clip-path` sejam
 * medidas contra ela, e nao contra o texto.
 */
.progress-bar__label-clip {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/*
 * Cor do trecho que cai sobre o preenchimento. Escuro serve em quase todos:
 * success 5.1:1, warning 6.3:1, danger 7.8:1. A excecao e o `primary`, onde o
 * azul e escuro demais (preto da 3.9:1, abaixo de AA) e branco resolve
 * (5.4:1) — por isso a cor e por variante, nao por posicao.
 */
.progress-bar__label--on-fill {
  color: var(--text-primary);
}

/*
 * Sem `text-shadow`: o branco sobre o azul do primary ja da 5.4:1 sem ele, e o
 * axe 4.11 compara a cor do texto com a da sombra (1.78:1 aqui) quando o texto
 * a usa como realce. Era decoracao herdada, custava uma violacao.
 */
.progress-bar--primary .progress-bar__label--on-fill {
  color: var(--text-white);
}
</style>
