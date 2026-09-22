export interface IListadorDePacotes {
  listar(): Promise<string[]>;
}

export type ManifestoDePacote = {
  nome: string;
  privado: boolean;
};
