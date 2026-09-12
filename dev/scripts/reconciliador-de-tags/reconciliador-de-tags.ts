import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extrairIgnorados, extrairManifesto, extrairVersao, lerJson } from '../listador-de-pacotes/manifesto';
import type { PacotePublicavel, RelatorioDeReconciliacao } from './reconciliador-de-tags.types';

/**
 * A tag que o changesets cria para cada pacote publicado: `nome@versao`.
 * Se a versao no `package.json` nao tem tag correspondente no remoto, o
 * repositorio esta dessincronizado do npm.
 */
export function tagEsperada(pacote: PacotePublicavel): string {
  return `${pacote.nome}@${pacote.versao}`;
}

/**
 * Le a saida de `git ls-remote --tags` e devolve o conjunto de nomes de tag.
 *
 * Cada linha e `<sha>\trefs/tags/<tag>`, e tags anotadas ainda trazem uma
 * segunda linha `refs/tags/<tag>^{}` (o objeto desreferenciado). Descartamos o
 * `^{}` para ficar com o nome cru da tag.
 */
export function parsearTagsDoLsRemote(saida: string): Set<string> {
  const tags = new Set<string>();
  for (const linha of saida.split('\n')) {
    const ref = linha.split('\t')[1];
    if (!ref?.startsWith('refs/tags/')) continue;
    tags.add(ref.slice('refs/tags/'.length).replace(/\^\{\}$/, ''));
  }
  return tags;
}

/**
 * Confronta as versoes dos pacotes publicaveis com as tags do remoto ao fim do
 * job de release. Um pacote cuja versao atual nao tem tag no remoto significa
 * que ele saiu para o npm mas o marco nao chegou ao repositorio — exatamente o
 * estado misto do release de 06/09, que ainda por cima concluiu verde.
 */
export function reconciliarTags(pacotes: PacotePublicavel[], tagsRemotas: Iterable<string>): RelatorioDeReconciliacao {
  const tags = tagsRemotas instanceof Set ? tagsRemotas : new Set(tagsRemotas);

  const itens = pacotes
    .map((pacote) => {
      const tag = tagEsperada(pacote);
      return tags.has(tag)
        ? ({ tipo: 'marcado', pacote: pacote.nome, tag } as const)
        : ({ tipo: 'sem-tag', pacote: pacote.nome, tag } as const);
    })
    .sort((a, b) => a.pacote.localeCompare(b.pacote));

  return { itens, dessincronizados: itens.filter((item) => item.tipo === 'sem-tag').length };
}

/**
 * Enumera os pacotes publicaveis com sua versao atual — o mesmo conjunto que o
 * `ListadorDePacotesChangesets` e o validador de `repository.url` enxergam: nao
 * privados e fora do `ignore` do changesets.
 */
export async function lerPacotesPublicaveis(raizDoRepo: string): Promise<PacotePublicavel[]> {
  const config = await lerJson(join(raizDoRepo, '.changeset', 'config.json')).catch(() => undefined);
  const ignorados = extrairIgnorados(config);

  const pastas = await readdir(join(raizDoRepo, 'packages'), { withFileTypes: true });

  const pacotes: PacotePublicavel[] = [];
  for (const pasta of pastas) {
    if (!pasta.isDirectory()) continue;
    const json = await lerJson(join(raizDoRepo, 'packages', pasta.name, 'package.json')).catch(() => undefined);
    const manifesto = extrairManifesto(json);
    if (!manifesto || manifesto.privado || ignorados.has(manifesto.nome)) continue;

    const versao = extrairVersao(json);
    if (!versao) continue;
    pacotes.push({ nome: manifesto.nome, versao });
  }

  return pacotes.sort((a, b) => a.nome.localeCompare(b.nome));
}
