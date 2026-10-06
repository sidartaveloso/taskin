/**
 * As formas desenhadas dos baloes de quadrinho: o grito (contorno em estrela)
 * e o pensamento (nuvem com bolinhas).
 *
 * Fala, sussurro e narracao sao a caixa de CSS com borda; estas duas formas
 * nao cabem numa borda, e sao um SVG por cima da caixa, no tamanho medido
 * dela. Funcoes puras, testaveis sem navegador: recebem a caixa por fora
 * (border-box, origem no canto de cima a esquerda) e devolvem o desenho nas
 * mesmas coordenadas.
 *
 * A ponta do grito, e a ultima bolinha do pensamento, caem no mesmo ponto da
 * ponta do rabicho de fala (`speechBubbleTailReach`/`Drop`): quem ancora o
 * balao em algo, como o `TaskinSays`, nao precisa saber qual e a forma.
 */

import {
  SPEECH_BUBBLE_TAIL,
  type SpeechBubbleTail,
  speechBubbleTailReach,
  speechBubbleTailScale,
} from './SpeechBubble.types';

export interface BubbleBox {
  /** Largura e altura por fora (border-box), em px. */
  width: number;
  height: number;
  borderWidth: number;
  tail: SpeechBubbleTail;
  /** Do topo de dentro ate a base do rabicho, como a prop `tailTop`. */
  tailTop: number;
}

export interface Point {
  x: number;
  y: number;
}

const r = (n: number) => Math.round(n * 100) / 100;

/**
 * Onde o rabicho encosta e aponta, em coordenadas da caixa por fora: a base
 * (onde ele sai da lateral) e a ponta. Os mesmos numeros do rabicho de fala.
 */
export const tailAnchor = (box: BubbleBox): { baseTop: number; baseBottom: number; tip: Point } => {
  const k = speechBubbleTailScale(box.borderWidth);
  const top = box.borderWidth + box.tailTop;
  const reach = speechBubbleTailReach(box.borderWidth);
  return {
    baseTop: top + SPEECH_BUBBLE_TAIL.baseTop * k,
    baseBottom: top + SPEECH_BUBBLE_TAIL.baseBottom * k,
    tip: { x: box.tail === 'right' ? box.width + reach : -reach, y: top + SPEECH_BUBBLE_TAIL.tip.y * k },
  };
};

interface PerimeterPoint extends Point {
  /** A direcao para fora: nas arestas, a normal; nos cantos, a diagonal. */
  nx: number;
  ny: number;
  edge: 'top' | 'right' | 'bottom' | 'left' | 'tail';
}

/**
 * Pontos em volta de um retangulo, no sentido horario a partir do canto de
 * cima a esquerda, mais ou menos a cada `spacing` px. Cada aresta comeca no
 * seu canto; `even` forca um numero par de pontos por aresta, para os cantos
 * cairem sempre na mesma paridade.
 */
const perimeter = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  spacing: number,
  even: boolean,
): PerimeterPoint[] => {
  const D = Math.SQRT1_2;
  const edges = [
    { edge: 'top', from: { x: x0, y: y0 }, to: { x: x1, y: y0 }, corner: { nx: -D, ny: -D }, n: { nx: 0, ny: -1 } },
    { edge: 'right', from: { x: x1, y: y0 }, to: { x: x1, y: y1 }, corner: { nx: D, ny: -D }, n: { nx: 1, ny: 0 } },
    { edge: 'bottom', from: { x: x1, y: y1 }, to: { x: x0, y: y1 }, corner: { nx: D, ny: D }, n: { nx: 0, ny: 1 } },
    { edge: 'left', from: { x: x0, y: y1 }, to: { x: x0, y: y0 }, corner: { nx: -D, ny: D }, n: { nx: -1, ny: 0 } },
  ] as const;

  const pontos: PerimeterPoint[] = [];
  for (const e of edges) {
    const comprimento = Math.hypot(e.to.x - e.from.x, e.to.y - e.from.y);
    let n = Math.max(1, Math.round(comprimento / spacing));
    if (even && n % 2) n += 1;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const normal = i === 0 ? e.corner : e.n;
      pontos.push({
        x: e.from.x + (e.to.x - e.from.x) * t,
        y: e.from.y + (e.to.y - e.from.y) * t,
        ...normal,
        edge: e.edge,
      });
    }
  }
  return pontos;
};

/**
 * Troca os pontos da lateral do rabicho, na altura da base, pelo rabicho: a
 * base de baixo, a ponta e a base de cima, na ordem em que o contorno passa
 * (a esquerda ele sobe; a direita, desce).
 */
const comRabicho = <P extends Point & { edge: string }>(
  pontos: P[],
  box: BubbleBox,
  xDaLateral: number,
  folga: number,
  fazer: (p: Point) => P,
): P[] => {
  if (box.tail === 'none') return pontos;
  const { baseTop, baseBottom, tip } = tailAnchor(box);
  const lado = box.tail === 'left' ? 'left' : 'right';
  const naBase = (p: P) => p.edge === lado && p.y > baseTop - folga && p.y < baseBottom + folga;
  const primeiro = pontos.findIndex(naBase);
  const restantes = pontos.filter((p) => !naBase(p));
  const rabicho =
    lado === 'left'
      ? [fazer({ x: xDaLateral, y: baseBottom }), fazer(tip), fazer({ x: xDaLateral, y: baseTop })]
      : [fazer({ x: xDaLateral, y: baseTop }), fazer(tip), fazer({ x: xDaLateral, y: baseBottom })];
  // Sem ponto da lateral na faixa (caixa baixa), entra antes do primeiro ponto
  // da aresta seguinte no sentido do contorno.
  const onde =
    primeiro >= 0
      ? primeiro
      : restantes.findIndex((p) => (lado === 'left' ? p.edge === 'left' && p.y < baseTop : p.edge === 'bottom'));
  const i = onde >= 0 ? onde : restantes.length;
  return [...restantes.slice(0, i), ...rabicho, ...restantes.slice(i)];
};

/** Um "aleatorio" que se repete: o mesmo balao tem sempre as mesmas pontas. */
const variacao = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

export const SHOUT = {
  /** As pontas de dentro ficam um pouco para dentro da caixa, no padding. */
  inset: 3,
  /** Quanto as pontas de fora passam da caixa, antes da variacao. */
  spike: 12,
  /** A distancia entre uma ponta de fora e a seguinte: poucas e grandes, como num grito de quadrinho, e nao um serrote. */
  step: 26,
  /** Cada ponta sai com 55% a 145% de `spike`: irregular de proposito. */
  jitter: [0.55, 1.45],
} as const;

/**
 * Os vertices do grito: alternam um ponto de dentro (na caixa, recuado
 * `inset`) e uma ponta de fora (empurrada pela normal, com `jitter` de
 * `spike`). Os cantos sao sempre pontas. O rabicho e mais uma ponta, longa,
 * ate o mesmo lugar da ponta do rabicho de fala.
 */
export const shoutPoints = (box: BubbleBox): Point[] => {
  const x0 = SHOUT.inset;
  const y0 = SHOUT.inset;
  const x1 = box.width - SHOUT.inset;
  const y1 = box.height - SHOUT.inset;
  const base = perimeter(x0, y0, x1, y1, SHOUT.step / 2, true).map((p, i) => {
    if (i % 2) return p;
    const [menor, maior] = SHOUT.jitter;
    const L = SHOUT.spike * (menor + (maior - menor) * variacao(i));
    return { ...p, x: p.x + p.nx * L, y: p.y + p.ny * L };
  });
  const xDaLateral = box.tail === 'right' ? x1 : x0;
  return comRabicho(base, box, xDaLateral, SHOUT.step / 2, (p) => ({ ...p, nx: 0, ny: 0, edge: 'tail' as const })).map(
    ({ x, y }) => ({ x: r(x), y: r(y) }),
  );
};

export const shoutOutline = (box: BubbleBox): string => {
  const pontos = shoutPoints(box);
  return `${pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')} Z`;
};

export const THOUGHT = {
  /** A nuvem passa pela caixa recuada isto; as bolhas saem para fora. */
  inset: 2,
  /** A distancia entre um gomo e o seguinte. */
  step: 22,
  /** O raio do arco, em relacao a distancia entre os pontos: quanto maior, mais rasos os gomos. */
  bulge: 0.62,
  /** As bolinhas do rabicho, de perto da nuvem ate a ponta: onde ficam (0 a 1) e o raio, na escala do rabicho. */
  puffs: [
    { at: 0.15, r: 5.5 },
    { at: 0.55, r: 3.8 },
    { at: 1, r: 2.4 },
  ],
} as const;

export interface ThoughtCloud {
  d: string;
  puffs: (Point & { r: number })[];
}

/**
 * A nuvem do pensamento: gomos em volta da caixa (arcos que estufam para fora,
 * porque o contorno anda no sentido horario) e, no lugar do rabicho, bolinhas
 * cada vez menores da lateral ate a ponta, que e a ultima.
 */
export const thoughtCloud = (box: BubbleBox): ThoughtCloud => {
  const x0 = THOUGHT.inset;
  const y0 = THOUGHT.inset;
  const x1 = box.width - THOUGHT.inset;
  const y1 = box.height - THOUGHT.inset;
  const pontos = perimeter(x0, y0, x1, y1, THOUGHT.step, false);

  let d = `M${r(pontos[0]?.x ?? x0)} ${r(pontos[0]?.y ?? y0)}`;
  for (let i = 1; i <= pontos.length; i++) {
    const a = pontos[i - 1] as Point;
    const b = pontos[i % pontos.length] as Point;
    const raio = r(Math.hypot(b.x - a.x, b.y - a.y) * THOUGHT.bulge);
    d += ` A${raio} ${raio} 0 0 1 ${r(b.x)} ${r(b.y)}`;
  }
  d += ' Z';

  if (box.tail === 'none') return { d, puffs: [] };
  const k = speechBubbleTailScale(box.borderWidth);
  const { baseTop, baseBottom, tip } = tailAnchor(box);
  const inicio = { x: box.tail === 'right' ? x1 + 4 : x0 - 4, y: (baseTop + baseBottom) / 2 };
  const puffs = THOUGHT.puffs.map(({ at, r: raio }) => ({
    x: r(inicio.x + (tip.x - inicio.x) * at),
    y: r(inicio.y + (tip.y - inicio.y) * at),
    r: r(raio * k),
  }));
  return { d, puffs };
};
