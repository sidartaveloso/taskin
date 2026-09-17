/**
 * Os humores que o Taskin sabe fazer, em tempo de execucao.
 *
 * A lista existe como valor, e nao so como tipo, porque quem precisa dela
 * precisa percorre-la: a story `AllMoods`, o mural da landing, um seletor de
 * humor. Cada um desses lugares ja teve — ou teria — a sua propria copia a mao,
 * que envelhece em silencio quando um humor novo entra no SVG.
 *
 * A ordem nao e alfabetica de proposito: comeca pelo `neutral`, que e o default
 * do componente, e segue na ordem em que os humores foram desenhados. Quem
 * mostra a lista mostra essa ordem.
 */
export const TASKIN_MOODS = [
  'neutral',
  'smirk',
  'happy',
  'annoyed',
  'sarcastic',
  'crying',
  'cold',
  'hot',
  'dancing',
  'furious',
  'sleeping',
  'in-love',
  'tired',
  'thoughtful',
  'vomiting',
  'taking-selfie',
  'farting',
] as const;
