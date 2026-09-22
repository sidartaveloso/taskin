/**
 * A marca de pular CI que **esta chamada** deve escrever.
 *
 * O padrao e do projeto, em `automation.ciSkipTag`, e ele esta certo para um
 * push que so muda status: nao ha o que verificar, e a execucao seria
 * desperdicio. O que a configuracao nao alcanca e a chamada em que o commit de
 * status viaja junto com trabalho de verdade — e o GitHub le **apenas o commit
 * de topo** do push, entao a marca ali pula o pipeline inteiro, release
 * incluido.
 *
 * Por isso a excecao e por chamada, e nao uma segunda configuracao.
 *
 * Ela so desliga. Nao existe o caminho inverso — forcar a marca num projeto que
 * configurou string vazia — porque um projeto que pediu "CI sempre" nao tem uso
 * para pular caso a caso, e opcao sem uso e defeito.
 *
 * Devolve `undefined` quando o projeto nao configurou nada e a chamada nao
 * pediu nada: e o que faz o `GitService` aplicar o seu proprio padrao, em vez
 * de receber uma string vazia que significaria "sem marca".
 *
 * @param configurada - `automation.ciSkipTag` do projeto, se houver
 * @param skipCi - O que a chamada disse: `false` com `--no-skip-ci`, `true` ou
 *   `undefined` quando a flag nao foi passada (o commander preenche `true` para
 *   um `--no-x` ausente)
 * @public
 */
export function resolveCiSkipTag(configurada: string | undefined, skipCi: boolean | undefined): string | undefined {
  return skipCi === false ? '' : configurada;
}
