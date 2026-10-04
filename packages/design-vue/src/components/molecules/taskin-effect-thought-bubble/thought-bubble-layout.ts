/**
 * Layout dos baloes do mascote: o de pensamento, e a caixa do de fala.
 *
 * `<text>` em SVG nao quebra linha: o balao era uma elipse fixa de `rx: 35` com
 * uma linha de 24px, entao qualquer frase maior que meia duzia de caracteres
 * vazava por fora do desenho. Como a frase e configuravel — e o caso de uso e
 * justamente chamar a pessoa pelo nome, "Bruno, Shhhhhhhhhhhh..." —, o tamanho
 * do balao precisa vir do conteudo.
 *
 * A largura do texto e estimada por contagem de caracteres, e nao medida: medir
 * exigiria o DOM, e isto precisa continuar sendo uma funcao pura, testavel sem
 * navegador. A razao de 0.55em por glifo e a media de uma fonte sem serifa para
 * texto latino; o excesso de folga fica por conta do preenchimento.
 */

import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

/** Quadro do mascote: `viewBox="0 0 320 260"`. */
export const BUBBLE_RIGHT_LIMIT = 316;
/** A cabeca do mascote vive a esquerda disto; o balao nao a cobre. */
export const BUBBLE_LEFT_LIMIT = 150;
export const BUBBLE_TOP_LIMIT = 4;

/**
 * Posicao de sempre, preservada enquanto a frase couber no balao minimo, em cada
 * variante. O do Sapin nasce mais alto e mais a direita: os olhos dele moram no
 * topo da cabeca, e o balao do Taskin cobriria o olho direito. A cauda continua
 * encostando na cabeca.
 */
export const BUBBLE_BASE: Record<TaskinVariant, { cx: number; cy: number }> = {
  taskin: { cx: 210, cy: 50 },
  sapin: { cx: 250, cy: 34 },
};
const MIN_RX = 35;
const MIN_RY = 30;

const MAX_FONT_SIZE = 24;
const MIN_FONT_SIZE = 11;
const GLYPH_WIDTH_RATIO = 0.55;
const LINE_HEIGHT_RATIO = 1.15;
const PADDING_X = 12;
const PADDING_Y = 10;
const MAX_LINES = 3;

/**
 * O que muda de um balao para outro. O de pensamento usa os padroes; o de fala
 * (`speech-bubble-layout.ts`) cola no topo e para antes dos olhos.
 */
export interface BubbleLayoutOptions {
  /** Posicao de sempre, preservada enquanto a frase couber no balao minimo. */
  base: Record<TaskinVariant, { cx: number; cy: number }>;
  /** O balao nao avanca para a esquerda disto. Padrao: `BUBBLE_LEFT_LIMIT`. */
  leftLimit?: Partial<Record<TaskinVariant, number>>;
  /** A maior fonte que a frase curta ganha. Padrao: 24. */
  maxFontSize?: number;
  /**
   * Cola o balao no topo do quadro (`cy = ry + BUBBLE_TOP_LIMIT`), em vez de
   * preservar `base.cy`: e como o balao de fala fica acima dos olhos.
   */
  hugTop?: boolean;
}

export interface ThoughtBubbleLayout {
  /** Linhas ja quebradas, na ordem. */
  lines: string[];
  /** Coordenada `y` da linha de mesmo indice, para `dominant-baseline: central`. */
  lineY: number[];
  fontSize: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const arredondar = (n: number) => Math.round(n * 100) / 100;

/**
 * Quebra por palavras; parte uma palavra ao meio so quando ela sozinha nao cabe
 * na linha. Nunca descarta texto: `linhas.join('')` reconstroi a frase.
 *
 * A linha quebrada num espaco guarda esse espaco no fim. Sem isso o texto dos
 * `<tspan>` se emenda — "Bruno,Shhhhh..." para quem copia ou usa leitor de tela
 * —, e o SVG nao desenha espaco no fim de linha, entao nao custa nada visual.
 */
const quebrarEmLinhas = (texto: string, maxChars: number): string[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [''];

  const linhas: string[] = [];
  let atual = '';

  for (const palavra of palavras) {
    if (palavra.length > maxChars) {
      if (atual) {
        linhas.push(`${atual} `);
        atual = '';
      }
      let resto = palavra;
      while (resto.length > maxChars) {
        linhas.push(resto.slice(0, maxChars));
        resto = resto.slice(maxChars);
      }
      atual = resto;
      continue;
    }

    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (candidata.length <= maxChars) {
      atual = candidata;
    } else {
      linhas.push(`${atual} `);
      atual = palavra;
    }
  }

  if (atual) linhas.push(atual);
  return linhas;
};

/**
 * Largura util maxima do texto: o balao inteiro cabe entre os dois limites, e o
 * preenchimento e descontado dos dois lados.
 */
const maxCharsPara = (fontSize: number, maxTextWidth: number) =>
  Math.max(1, Math.floor(maxTextWidth / (fontSize * GLYPH_WIDTH_RATIO)));

export const layoutBubble = (
  texto: string,
  variant: TaskinVariant,
  options: BubbleLayoutOptions,
): ThoughtBubbleLayout => {
  const base = options.base[variant];
  const leftLimit = options.leftLimit?.[variant] ?? BUBBLE_LEFT_LIMIT;
  const maxFontSize = options.maxFontSize ?? MAX_FONT_SIZE;
  const maxTextWidth = BUBBLE_RIGHT_LIMIT - leftLimit - 2 * PADDING_X;
  const frase = texto.trim() || '?';
  const maiorPalavra = frase
    .split(/\s+/)
    .filter(Boolean)
    .reduce((maior, p) => Math.max(maior, p.length), 0);

  /*
   * Diminui a fonte ate as palavras caberem inteiras e o texto ocupar poucas
   * linhas. Partir palavra ao meio e o ultimo recurso, e nao o primeiro: com a
   * fonte cheia "Bruno, Shhhhhhhhhhhh..." cabe em tres linhas, mas so cortando
   * o "Shhhh" no meio — o que se le pior do que a mesma frase um pouco menor.
   */
  let fontSize = MIN_FONT_SIZE;
  let lines = quebrarEmLinhas(frase, maxCharsPara(MIN_FONT_SIZE, maxTextWidth));

  for (let tamanho = maxFontSize; tamanho >= MIN_FONT_SIZE; tamanho--) {
    const maxChars = maxCharsPara(tamanho, maxTextWidth);
    const candidatas = quebrarEmLinhas(frase, maxChars);
    if (candidatas.length <= MAX_LINES && maiorPalavra <= maxChars) {
      fontSize = tamanho;
      lines = candidatas;
      break;
    }
  }

  const larguraDoGlifo = fontSize * GLYPH_WIDTH_RATIO;
  const larguraDaMaiorLinha = lines.reduce((maior, l) => Math.max(maior, l.length), 0) * larguraDoGlifo;
  const alturaDaLinha = fontSize * LINE_HEIGHT_RATIO;

  const rx = Math.min((BUBBLE_RIGHT_LIMIT - leftLimit) / 2, Math.max(MIN_RX, larguraDaMaiorLinha / 2 + PADDING_X));
  const ry = Math.max(MIN_RY, (lines.length * alturaDaLinha) / 2 + PADDING_Y);

  // Cresce para a direita antes de crescer para a esquerda: a esquerda e onde
  // esta a cabeca do mascote, e um balao por cima dela nao se le.
  const cx = Math.min(BUBBLE_RIGHT_LIMIT - rx, Math.max(base.cx, leftLimit + rx));
  const cy = options.hugTop ? ry + BUBBLE_TOP_LIMIT : Math.max(base.cy, ry + BUBBLE_TOP_LIMIT);

  const primeiraLinha = cy - ((lines.length - 1) * alturaDaLinha) / 2;

  return {
    lines,
    lineY: lines.map((_, i) => arredondar(primeiraLinha + i * alturaDaLinha)),
    fontSize,
    cx: arredondar(cx),
    cy: arredondar(cy),
    rx: arredondar(rx),
    ry: arredondar(ry),
  };
};

/** O balao de pensamento: a elipse de sempre, na posicao de sempre. */
export const layoutThoughtBubble = (texto: string, variant: TaskinVariant = 'taskin'): ThoughtBubbleLayout =>
  layoutBubble(texto, variant, { base: BUBBLE_BASE });
