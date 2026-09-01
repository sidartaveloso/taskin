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

/**
 * `ja-configurado` nasce do 409 do registry: cada pacote aceita uma unica
 * configuracao de trusted publisher, entao tentar criar a segunda conflita.
 * E o resultado esperado ao reexecutar, nao um erro — mas fica como variante
 * propria em vez de virar `configurado`, para nao mascarar um 409 que venha
 * por outro motivo.
 */
export type ResultadoDeConfianca =
  | { tipo: 'configurado' }
  | { tipo: 'ja-configurado' }
  | { tipo: 'falha'; motivo: string };

export type ResultadoDeAutenticacao = { tipo: 'autenticado'; usuario: string } | { tipo: 'falha'; motivo: string };
