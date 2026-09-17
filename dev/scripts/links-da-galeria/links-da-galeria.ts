/**
 * Um link de markdown cujo destino e a galeria de componentes, com a linha em
 * que ele aparece.
 */
export type LinkEncontrado = { linha: number; trecho: string };

const LINK = /\[[^\]]*\]\(\/components\/[^)]*\)/g;
const CERCA = /^\s*(```|~~~)/;

/**
 * Acha links de markdown apontando para `/components/`.
 *
 * A galeria e o Storybook copiado para dentro da arvore publicada pelo workflow
 * do Pages, e nao uma pagina do vitepress. Escrita em markdown, ela quebra dos
 * dois jeitos possiveis: sem `target`, o roteador intercepta o clique e mostra
 * o 404 do proprio site; com `target`, o plugin de link do vitepress para de
 * aplicar o `base` e o href perde o `/taskin/`. Por isso o link vive num
 * componente do tema, e o markdown nao deve conter nenhum.
 *
 * Blocos de codigo ficam de fora: ali o link e exemplo, nao navegacao.
 */
export function linksMarkdownParaGaleria(conteudo: string): LinkEncontrado[] {
  const encontrados: LinkEncontrado[] = [];
  let dentroDeCodigo = false;

  conteudo.split('\n').forEach((texto, indice) => {
    if (CERCA.test(texto)) {
      dentroDeCodigo = !dentroDeCodigo;
      return;
    }
    if (dentroDeCodigo) return;

    for (const achado of texto.matchAll(LINK)) {
      encontrados.push({ linha: indice + 1, trecho: achado[0] });
    }
  });

  return encontrados;
}
