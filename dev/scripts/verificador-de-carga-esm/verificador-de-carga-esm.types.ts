/**
 * Como a carga foi exercitada: `import` pelo nome do pacote, para biblioteca, ou
 * o bin rodado com `--version`, para CLI — importar o CLI executaria o comando.
 */
export type FormaDeCarga = { tipo: 'import' } | { tipo: 'bin'; bin: string };

export type ItemDeCarga =
  | { tipo: 'ok'; pacote: string; forma: FormaDeCarga }
  | { tipo: 'falha'; pacote: string; forma: FormaDeCarga; erro: string };

export type RelatorioDeCarga = {
  itens: ItemDeCarga[];
  falhas: number;
};
