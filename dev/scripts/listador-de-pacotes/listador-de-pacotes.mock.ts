import type { IListadorDePacotes } from './listador-de-pacotes.types';

export class ListadorDePacotesMock implements IListadorDePacotes {
  constructor(private readonly nomes: string[]) {}

  listar(): Promise<string[]> {
    return Promise.resolve([...this.nomes].sort());
  }
}
