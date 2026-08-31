export interface IClienteNpm {
  confiarEmGithubActions(alvo: AlvoDeConfianca): Promise<ResultadoDeConfianca>;
}

export type AlvoDeConfianca = {
  pacote: string;
  repositorio: string;
  workflow: string;
};

export type ResultadoDeConfianca = { tipo: 'configurado' } | { tipo: 'falha'; motivo: string };
