export type PacotePublicavel = {
  nome: string;
  versao: string;
};

/**
 * A catraca so exige tag da versao que ESTA no npm — nunca do que o
 * `changeset publish` disse ter feito. Por isso ela conhece os quatro estados:
 * `nao-publicado` (versao ainda fora do registry, entao exigir tag seria falso
 * positivo em pacote novo) e `indeterminado` (nao deu para perguntar ao npm, e
 * decidir seria chutar) alem do par `marcado`/`sem-tag`.
 */
export type ItemDeReconciliacao =
  /** Versao no npm e tag no remoto: em dia. */
  | { tipo: 'marcado'; pacote: string; tag: string }
  /** Versao no npm mas sem tag no remoto: o estado misto do release de 06/09. */
  | { tipo: 'sem-tag'; pacote: string; tag: string }
  /** Versao ainda fora do npm: nao ha marco a exigir (ex.: pacote recem-criado). */
  | { tipo: 'nao-publicado'; pacote: string; tag: string }
  /** Nao deu para perguntar ao npm: verde as cegas e o que se quer evitar. */
  | { tipo: 'indeterminado'; pacote: string; tag: string; motivo: string };

export type RelatorioDeReconciliacao = {
  itens: ItemDeReconciliacao[];
  /** Versoes publicadas no npm sem tag no remoto — cada uma reprova o release. */
  dessincronizados: number;
  /** Pacotes cujo estado no npm nao pode ser confirmado — tambem reprovam. */
  indeterminados: number;
};
