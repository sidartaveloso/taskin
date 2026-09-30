/**
 * As acoes que o mascote sabe fazer uma vez so, em tempo de execucao.
 *
 * Um humor e um estado: fica em laco ate trocar. Uma acao e um gesto — acena,
 * diz sim, diz nao — que roda uma vez, avisa o fim e devolve o bicho ao humor em
 * que estava. Quem pede e `play(acao)`, exposto pelo componente.
 *
 * A lista existe como valor, e nao so como tipo, pelo mesmo motivo de
 * `TASKIN_MOODS`: a story `Actions` desenha um botao por item, e uma copia a mao
 * envelhece calada quando uma acao nova entra.
 *
 * Nem toda variante precisa ter toda acao: a que nao tem resolve `false` na hora.
 *
 * Este arquivo nao importa nada, como `Taskin.variants.ts`.
 */
export const TASKIN_ACTIONS = [
  'nod',
  'shake',
  'celebrate',
  'point-up',
  'point-down',
  'wave',
  'start',
  'blocked',
  'effort',
  'wake',
] as const;

/** Uma acao de uma vez so. Deriva de `TASKIN_ACTIONS`. */
export type TaskinAction = (typeof TASKIN_ACTIONS)[number];
