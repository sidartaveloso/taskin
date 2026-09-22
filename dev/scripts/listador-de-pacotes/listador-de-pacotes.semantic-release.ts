import { join } from 'node:path';
import type { IListadorDePacotes } from './listador-de-pacotes.types';
import { extrairManifesto, extrairRaizesDePublicacao, lerJson } from './manifesto';

export class ListadorDePacotesSemanticRelease implements IListadorDePacotes {
  constructor(private readonly raizDoRepo: string) {}

  async listar(): Promise<string[]> {
    const config = await lerJson(join(this.raizDoRepo, '.releaserc.json')).catch(() => undefined);

    const nomes: string[] = [];
    for (const raiz of extrairRaizesDePublicacao(config)) {
      const manifesto = extrairManifesto(
        await lerJson(join(this.raizDoRepo, raiz, 'package.json')).catch(() => undefined),
      );
      if (!manifesto || manifesto.privado) continue;
      nomes.push(manifesto.nome);
    }
    return nomes.sort();
  }
}
