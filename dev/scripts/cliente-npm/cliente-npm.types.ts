export interface IClienteNpm {
  usuarioAutenticado(): Promise<string | undefined>;
  autenticar(): Promise<ResultadoDeAutenticacao>;
  estadoNoRegistry(pacote: string): Promise<EstadoNoRegistry>;
  confiancaConfigurada(pacote: string): Promise<EstadoDaConfianca>;
  revogarConfianca(pacote: string, id: string): Promise<ResultadoDeRevogacao>;
  confiarEmGithubActions(alvo: AlvoDeConfianca, otp?: string): Promise<ResultadoDeConfianca>;
}

/**
 * Interativo herda o stdin do terminal: o npm pergunta o 2FA e o usuario
 * responde. Nao interativo captura tudo e nunca pergunta — num runner e a
 * diferenca entre falhar com mensagem e pendurar num prompt que ninguem ve.
 */
export type ModoDeExecucao = { tipo: 'interativo' } | { tipo: 'nao-interativo' };

export type AlvoDeConfianca = {
  pacote: string;
  repositorio: string;
  workflow: string;
};

/**
 * `indeterminado` existe para nao confundir "o registry disse que nao existe"
 * com "nao deu para perguntar". Tratar queda de rede como pacote ausente faria
 * o script recomendar publicar algo que ja esta publicado.
 */
export type EstadoNoRegistry =
  | { tipo: 'publicado'; versao: string }
  | { tipo: 'ausente' }
  | { tipo: 'indeterminado'; motivo: string };

/**
 * O `npm trust list` sai com codigo 0 nos dois casos: com configuracao ele
 * imprime os campos, sem configuracao imprime "No trust configurations found".
 * Quem distingue e o texto, nao o exit code.
 */
export type EstadoDaConfianca =
  | { tipo: 'configurada'; id: string; repositorio: string; workflow: string }
  | { tipo: 'ausente' }
  | { tipo: 'indeterminado'; motivo: string };

/**
 * `ja-configurado` nasce do 409 do registry: cada pacote aceita uma unica
 * configuracao de trusted publisher, entao criar a segunda conflita. Fica como
 * variante propria em vez de virar `configurado` para nao mascarar um 409 que
 * venha por outro motivo.
 */
export type ResultadoDeConfianca =
  | { tipo: 'configurado' }
  | { tipo: 'ja-configurado' }
  | { tipo: 'falha'; motivo: string };

export type ResultadoDeAutenticacao = { tipo: 'autenticado'; usuario: string } | { tipo: 'falha'; motivo: string };

export type ResultadoDeRevogacao = { tipo: 'revogado' } | { tipo: 'falha'; motivo: string };
