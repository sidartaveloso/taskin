/**
 * Os bichos que o mascote sabe ser, em tempo de execucao.
 *
 * O Taskin e o polvo; o Sapin e o sapinho da marca para SAP. Nao sao dois
 * componentes: e o mesmo `Taskin`, com os mesmos humores, comportamentos e
 * movimentos, e cada peca (corpo, olhos, boca, bracos, efeitos) desenha a sua
 * variante. A lista existe como valor, e nao so como tipo, pelo mesmo motivo de
 * `TASKIN_MOODS`: quem mostra as variantes precisa percorre-las — o seletor da
 * story, o `it.each` dos testes — e uma copia a mao envelhece calada.
 *
 * Comeca pelo `taskin`, que e o default do componente.
 *
 * Este arquivo nao importa nada: os atomos importam o tipo daqui sem formar
 * ciclo com o organismo.
 */
export const TASKIN_VARIANTS = ['taskin', 'sapin'] as const;

/**
 * Qual bicho o mascote desenha. Deriva de `TASKIN_VARIANTS`, pelo mesmo motivo
 * do `TaskinMood`, e mora aqui, e nao em `Taskin.types.ts`, porque os atomos
 * precisam dele e `Taskin.types.ts` ja importa os tipos dos atomos.
 */
export type TaskinVariant = (typeof TASKIN_VARIANTS)[number];
