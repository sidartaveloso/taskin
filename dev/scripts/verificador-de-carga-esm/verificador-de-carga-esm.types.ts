/**
 * Como a carga foi exercitada: `import` pelo nome do pacote, para biblioteca, ou
 * o bin rodado com `--version`, para CLI — importar o CLI executaria o comando.
 */
export type FormaDeCarga = { tipo: 'import' } | { tipo: 'bin'; bin: string };

/**
 * De onde saiu o que o consumidor carregou: o tarball empacotado aqui, ou o que
 * ja esta no registry nessa mesma versao — que e o que qualquer instalacao
 * recebe, porque o `changeset publish` nao publica de novo uma versao que existe.
 */
export type OrigemDoPacote = 'tarball_local' | 'registry';

export type ItemDeCarga =
  | { tipo: 'ok'; pacote: string; origem: OrigemDoPacote; forma: FormaDeCarga }
  | { tipo: 'falha'; pacote: string; origem: OrigemDoPacote; forma: FormaDeCarga; erro: string };

/**
 * Busca o tarball de um `nome@versao` ja publicado, grava em `destino` e
 * devolve o caminho. `undefined` quando essa versao nao esta no registry.
 */
export type BuscarPublicado = (
  pacote: { nome: string; versao: string },
  destino: string,
) => Promise<string | undefined>;

export type OpcoesDeCarga = {
  /**
   * Sem ela, todo pacote vem do tarball local e a verificacao nao usa rede. Com
   * ela, o pacote cuja versao ja esta publicada vem de onde a busca disser.
   */
  buscarPublicado?: BuscarPublicado;
};

export type RelatorioDeCarga = {
  itens: ItemDeCarga[];
  falhas: number;
  /** `nome@versao` de cada pacote carregado do registry, e nao do tarball local. */
  doRegistry: string[];
};
