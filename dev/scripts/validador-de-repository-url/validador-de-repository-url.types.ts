export type ItemDeValidacao =
  | { tipo: 'ok'; pacote: string }
  | { tipo: 'sem-repository-url'; pacote: string; caminho: string };

export type RelatorioDeValidacao = {
  itens: ItemDeValidacao[];
  invalidos: number;
};
