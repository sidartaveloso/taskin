/**
 * Porta minima para rodar um comando externo. O marcador so precisa saber se o
 * comando falhou e com que mensagem — nao precisa de `stdout`, nem de shell,
 * nem de `cwd`. Manter a porta estreita e o que deixa o passo testavel sem
 * tocar em git nem no `gh`.
 */
export type ExecutarComando = (comando: string, argumentos: readonly string[]) => Promise<unknown>;

/** Cada passo ou fez o trabalho, ou encontrou o trabalho ja feito. Nao ha terceiro caso tolerado. */
export type ResultadoDePasso = 'feito' | 'ja-existia';

export type ResultadoDeMarco = {
  tag: string;
  /** A tag local: `changeset publish` costuma te-la criado antes. */
  tagLocal: ResultadoDePasso;
  /** O empurrao para o remoto: e o passo que faltava acontecer. */
  tagNoRemoto: ResultadoDePasso;
  release: ResultadoDePasso;
};
