import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { IListadorDePacotes } from './listador-de-pacotes.types';
import { extrairIgnorados, extrairManifesto, lerJson } from './manifesto';

export class ListadorDePacotesChangesets implements IListadorDePacotes {
  constructor(private readonly raizDoRepo: string) {}

  async listar(): Promise<string[]> {
    const ignorados = await this.lerIgnorados();
    const pastas = await readdir(join(this.raizDoRepo, 'packages'), { withFileTypes: true });

    const nomes: string[] = [];
    for (const pasta of pastas) {
      if (!pasta.isDirectory()) continue;
      const manifesto = extrairManifesto(
        await lerJson(join(this.raizDoRepo, 'packages', pasta.name, 'package.json')).catch(() => undefined),
      );
      if (!manifesto || manifesto.privado || ignorados.has(manifesto.nome)) continue;
      nomes.push(manifesto.nome);
    }
    return nomes.sort();
  }

  private async lerIgnorados(): Promise<Set<string>> {
    const config = await lerJson(join(this.raizDoRepo, '.changeset', 'config.json')).catch(() => undefined);
    return extrairIgnorados(config);
  }
}
