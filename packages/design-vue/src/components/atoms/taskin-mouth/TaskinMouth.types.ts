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
  /** How far the mouth sits from the reference drawing below. Default: where the octopus' is. */
  offset?: { x: number; y: number };
  /** Colour of the lips and the open mouth. Default: the octopus' ink. */
  ink?: string;
}

/** The octopus' mouth: the reference drawing (no offset) and its dark-blue ink. */
export const TASKIN_MOUTH = { offset: { x: 0, y: 0 }, ink: '#2C3E50' } as const;

/** The `transform` that moves a drawing tied to the reference mouth to a character's mouth. */
export const mouthTransform = (offset: { x: number; y: number }): string | undefined =>
  offset.x === 0 && offset.y === 0 ? undefined : `translate(${offset.x} ${offset.y})`;

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
