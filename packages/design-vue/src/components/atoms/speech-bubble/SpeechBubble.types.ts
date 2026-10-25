/**
 * De que lado sai o rabicho: `left` aponta para quem esta a esquerda do balao
 * (o caso do `TaskinSays`), `right` espelha, `none` e uma caixa sem rabicho.
 */
export type SpeechBubbleTail = 'left' | 'right' | 'none';

/**
 * Como se fala, na forma do balao, como nos quadrinhos: `speech` (fala, a
 * caixa de cantos redondos), `shout` (grito, contorno em estrela e texto em
 * negrito), `whisper` (sussurro, borda tracejada e texto em italico),
 * `thought` (pensamento, nuvem com bolinhas no lugar do rabicho) e
 * `narration` (narracao, a caixa reta e amarelada, sem rabicho).
 */
export const SPEECH_BUBBLE_KINDS = ['speech', 'shout', 'whisper', 'thought', 'narration'] as const;
export type SpeechBubbleKind = (typeof SPEECH_BUBBLE_KINDS)[number];

export interface SpeechBubbleProps {
  /** O que vai escrito. O slot padrao, quando vem, ganha dele. */
  text?: string;
  /** A forma do balao: fala, grito, sussurro, pensamento ou narracao. Padrao: `speech`. */
  kind?: SpeechBubbleKind;
  /** De que lado sai o rabicho. Padrao: `left`. A narracao nunca tem. */
  tail?: SpeechBubbleTail;
  /** A distancia, em px, do topo do balao ate a base do rabicho. Padrao: 14, fora do canto arredondado. */
  tailTop?: number;
  /** Cor de fundo (e do rabicho). Sem ela vale `--speech-bubble-bg`, ou branco. */
  background?: string;
  /** Cor da borda (e do contorno do rabicho). Sem ela vale `--speech-bubble-border-color`, ou `#2c3e50`. */
  borderColor?: string;
  /** Cor do texto. Sem ela vale `--speech-bubble-text-color`, ou `#2c3e50`. */
  textColor?: string;
  /** Espessura da borda, em px. Sem ela vale `--speech-bubble-border-width`, ou 2. */
  borderWidth?: number;
  /** Tamanho da fonte, em px. Sem ele vale `--speech-bubble-font-size`, ou 15. */
  fontSize?: number;
  /** Raio dos cantos, em px. Sem ele vale `--speech-bubble-radius`, ou 14. */
  radius?: number;
  /** Largura maxima, em px; o texto quebra dentro dela. Sem ela vale `--speech-bubble-max-width`, ou 260. */
  maxWidth?: number;
  /** O pop de entrada. Respeita `prefers-reduced-motion`. Padrao: `true`. */
  animated?: boolean;
}

/**
 * A geometria do rabicho, no SVG de 30x30 dele: a base fica no meio da borda
 * do balao (x 23), entre y 3 e 15, e a ponta em (2, 21). Quem posiciona o
 * balao em relacao a algo (o `TaskinSays`) usa isto para a ponta encostar.
 */
export const SPEECH_BUBBLE_TAIL = {
  size: 30,
  baseX: 23,
  baseTop: 3,
  baseBottom: 15,
  tip: { x: 2, y: 21 },
} as const;

export const SPEECH_BUBBLE_DEFAULTS = {
  tailTop: 14,
  borderWidth: 2,
} as const;

/**
 * O rabicho cresce com a borda: com a abertura de 12px e borda grossa, sobrava
 * so um fio de fundo entre as curvas. Ate 2px fica do tamanho de sempre; dai em
 * diante, meio tanto a cada px (4px: 1,5x; 6px: 2x).
 */
export const speechBubbleTailScale = (borderWidth: number = SPEECH_BUBBLE_DEFAULTS.borderWidth): number =>
  Math.max(1, 0.5 + borderWidth / 4);

/**
 * Quanto a ponta do rabicho passa da borda de fora do balao, em px. O SVG
 * fica com a borda centrada em `baseX`, entao a borda de fora esta em
 * `baseX - b/2` e a ponta, `tip.x` adiante, tudo na escala do rabicho.
 */
export const speechBubbleTailReach = (borderWidth: number = SPEECH_BUBBLE_DEFAULTS.borderWidth): number =>
  (SPEECH_BUBBLE_TAIL.baseX - SPEECH_BUBBLE_TAIL.tip.x) * speechBubbleTailScale(borderWidth) - borderWidth / 2;

/** Quanto a ponta do rabicho desce do topo de dentro do balao, em px. */
export const speechBubbleTailDrop = (
  tailTop: number = SPEECH_BUBBLE_DEFAULTS.tailTop,
  borderWidth: number = SPEECH_BUBBLE_DEFAULTS.borderWidth,
): number => tailTop + SPEECH_BUBBLE_TAIL.tip.y * speechBubbleTailScale(borderWidth);
