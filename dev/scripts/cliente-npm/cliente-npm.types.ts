export interface IClienteNpm {
  usuarioAutenticado(): Promise<string | undefined>;
  autenticar(): Promise<ResultadoDeAutenticacao>;
  confiarEmGithubActions(alvo: AlvoDeConfianca, otp?: string): Promise<ResultadoDeConfianca>;
}

/**
 * Interativo herda os descritores do terminal: o npm pergunta o 2FA e o usuario
 * responde. Nao interativo captura a saida e nunca pergunta nada — o que num
 * runner de CI e a diferenca entre falhar com mensagem e pendurar para sempre
 * num prompt que ninguem ve.
 */
export type ModoDeExecucao = { tipo: 'interativo' } | { tipo: 'nao-interativo' };

export type AlvoDeConfianca = {
  pacote: string;
  repositorio: string;
  workflow: string;
};

export type ResultadoDeConfianca = { tipo: 'configurado' } | { tipo: 'falha'; motivo: string };

export type ResultadoDeAutenticacao = { tipo: 'autenticado'; usuario: string } | { tipo: 'falha'; motivo: string };
