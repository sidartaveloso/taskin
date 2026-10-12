import type { TaskinVariant } from '../../organisms/taskin/Taskin.variants';

export type MouthExpression =
  | 'neutral'
  | 'smile'
  | 'frown'
  | 'open'
  | 'wide-open'
  | 'o-shape'
  | 'smirk'
  | 'surprised'
  /** Ofegante, de lingua para fora: o calor. */
  | 'panting';

export interface TaskinMouthProps {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
  /** Falando: a boca alterna entre a expressao e aberta, silaba a silaba. */
  speaking?: boolean;
  /** Which character the mouth belongs to: it sits higher on the Sapin. */
  variant?: TaskinVariant;
}

/**
 * Quanto a boca de cada variante anda a partir do desenho do Taskin. As
 * expressoes sao as mesmas; no Sapin a boca fica mais alta, entre os olhos e a
 * barriga, como na referencia. O vomito sai da boca e le daqui a mesma ancora.
 */
export const MOUTH_OFFSET: Record<TaskinVariant, { x: number; y: number }> = {
  taskin: { x: 0, y: 0 },
  sapin: { x: 0, y: -21 },
};

/**
 * A tinta da boca de cada variante: o azul-escuro do polvo, e o verde-escuro da
 * referencia no Sapin.
 */
export const MOUTH_INK: Record<TaskinVariant, string> = {
  taskin: '#2C3E50',
  sapin: '#134635',
};

/** O `transform` que leva um desenho preso a boca do Taskin para a boca da variante. */
export const mouthTransform = (variant: TaskinVariant): string | undefined => {
  const { x, y } = MOUTH_OFFSET[variant];
  return x === 0 && y === 0 ? undefined : `translate(${x} ${y})`;
};

/**
 * O desenho da boca em cada expressao. A fala alterna entre duas linhas daqui —
 * a da expressao do momento e a do `open` —, por isso a tabela e uma so.
 */
export const MOUTH_PATHS: Record<MouthExpression, string> = {
  neutral: 'M145 125 Q160 130 175 125',
  smile: 'M145 125 Q160 133 175 125',
  frown: 'M145 125 Q160 118 175 125',
  // Forma oval pequena para boca aberta
  open: 'M152 122 Q160 128 168 122 Q160 126 152 122 Z',
  // Boca totalmente escancarada (oval muito maior)
  'wide-open': 'M140 115 Q160 145 180 115 Q160 142 140 115 Z',
  // Formato O (círculo perfeito pequeno)
  'o-shape': 'M154 122 Q154 119 160 119 Q166 119 166 122 Q166 128 160 128 Q154 128 154 122 Z',
  // Sorriso assimétrico de lado (mais alto à direita)
  smirk: 'M145 127 Q155 130 165 127 Q170 124 175 122',
  // Surpresa (O alongado vertical - maior que o-shape)
  surprised: 'M155 118 Q152 118 152 125 Q152 132 155 132 Q165 132 165 125 Q165 118 155 118 Z',
  // Ofegante: aberta e redonda, com os cantos caidos — nao o sorriso
  // escancarado do `wide-open`, que no calor parecia contentamento.
  panting: 'M143 124 Q160 112 177 124 Q176 139 160 140 Q144 139 143 124 Z',
};

/** As expressoes de boca aberta, que levam a tinta por dentro. */
export const FILLED_MOUTHS: readonly MouthExpression[] = ['open', 'wide-open', 'o-shape', 'surprised', 'panting'];
