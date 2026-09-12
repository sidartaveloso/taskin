export type PacotePublicavel = {
  nome: string;
  versao: string;
};

export type ItemDeReconciliacao =
  | { tipo: 'marcado'; pacote: string; tag: string }
  | { tipo: 'sem-tag'; pacote: string; tag: string };

export type RelatorioDeReconciliacao = {
  itens: ItemDeReconciliacao[];
  dessincronizados: number;
};
