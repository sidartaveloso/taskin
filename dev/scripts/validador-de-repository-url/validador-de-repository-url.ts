import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extrairIgnorados, extrairManifesto, extrairRepositoryUrl, lerJson } from '../listador-de-pacotes/manifesto';
import type { ItemDeValidacao, RelatorioDeValidacao } from './validador-de-repository-url.types';

/**
 * Recusa o release quando um pacote publicavel nao declara `repository.url`.
 *
 * Foi esse campo vazio no `@opentask/ui-sense` que devolveu E422 do npm no meio
 * do `changeset publish` (a proveniencia do sigstore exige o campo) e partiu o
 * release de 06/09 em duas passadas, deixando o repositorio sem tags. Validar
 * antes de publicar transforma um publish quebrado no meio numa falha barata,
 * antes de qualquer pacote sair para o registry.
 *
 * O conjunto de pacotes publicaveis e o mesmo que o `ListadorDePacotesChangesets`
 * enxerga: nao privados e fora do `ignore` do changesets.
 */
export async function validarRepositoryUrl(raizDoRepo: string): Promise<RelatorioDeValidacao> {
  const config = await lerJson(join(raizDoRepo, '.changeset', 'config.json')).catch(() => undefined);
  const ignorados = extrairIgnorados(config);

  const pastas = await readdir(join(raizDoRepo, 'packages'), { withFileTypes: true });

  const itens: ItemDeValidacao[] = [];
  for (const pasta of pastas) {
    if (!pasta.isDirectory()) continue;
    const caminho = join(raizDoRepo, 'packages', pasta.name, 'package.json');
    const json = await lerJson(caminho).catch(() => undefined);
    const manifesto = extrairManifesto(json);
    if (!manifesto || manifesto.privado || ignorados.has(manifesto.nome)) continue;

    const url = extrairRepositoryUrl(json);
    itens.push(
      url ? { tipo: 'ok', pacote: manifesto.nome } : { tipo: 'sem-repository-url', pacote: manifesto.nome, caminho },
    );
  }

  itens.sort((a, b) => a.pacote.localeCompare(b.pacote));
  return { itens, invalidos: itens.filter((item) => item.tipo === 'sem-repository-url').length };
}
