import type { IListadorDePacotes } from '../listador-de-pacotes';

export interface IConfiguradorDeConfianca {
  configurar(): Promise<RelatorioDeConfianca>;
}

export type RepoAlvo = {
  repositorio: string;
  workflow: string;
  listador: IListadorDePacotes;
};

export type ItemDoRelatorio =
  | { tipo: 'configurado'; pacote: string; repositorio: string }
  | { tipo: 'ja-configurado'; pacote: string; repositorio: string }
  | { tipo: 'nao-publicado'; pacote: string; repositorio: string }
  | { tipo: 'falha'; pacote: string; repositorio: string; motivo: string };

export type RelatorioDeConfianca = {
  itens: ItemDoRelatorio[];
  configurados: number;
  jaConfigurados: number;
  naoPublicados: number;
  falhas: number;
};
