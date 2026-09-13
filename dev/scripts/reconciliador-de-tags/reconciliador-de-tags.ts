import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { EstadoNoRegistry } from '../cliente-npm/cliente-npm.types';
import { extrairIgnorados, extrairManifesto, extrairVersao, lerJson } from '../listador-de-pacotes/manifesto';
import type { ItemDeReconciliacao, PacotePublicavel, RelatorioDeReconciliacao } from './reconciliador-de-tags.types';

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
 * Confronta as versoes publicadas no npm com as tags do remoto ao fim do job de
 * release. A verdade e cruzada de dois fatos externos — a versao esta no npm? a
 * tag esta no remoto? — e nunca do que a passada de `changeset publish` reportou
 * ter feito, nem do output `published` da changesets/action. Foi justamente
 * gatilhar a catraca por esse output (que ja veio errado no release de 06/09,
 * dizendo "Created git tags" sem empurrar nada) que a deixava pulavel: se a
 * action mente que nao publicou, a catraca condicionada a `published == 'true'`
 * nem roda, e o release volta a fechar verde com o repositorio dessincronizado.
 *
 * Por derivar do npm, a catraca so exige tag do que ESTA no registry: um pacote
 * recem-criado, ainda fora do npm, nao vira falso positivo, e por isso ela pode
 * rodar em todo release sem depender de flag nenhuma.
 *
 * @param estadosNoNpm estado de CADA pacote na SUA versao atual (consulta a
 *   `nome@versao`). Um pacote sem entrada e tratado como indeterminado — nao da
 *   para afirmar honestidade sem ter perguntado.
 */
export function reconciliarTags(
  pacotes: PacotePublicavel[],
  estadosNoNpm: Map<string, EstadoNoRegistry>,
  tagsRemotas: Iterable<string>,
): RelatorioDeReconciliacao {
  const tags = tagsRemotas instanceof Set ? tagsRemotas : new Set(tagsRemotas);

  const itens: ItemDeReconciliacao[] = pacotes
    .map((pacote): ItemDeReconciliacao => {
      const tag = tagEsperada(pacote);
      const estado = estadosNoNpm.get(pacote.nome) ?? {
        tipo: 'indeterminado',
        motivo: 'sem consulta ao registry para este pacote',
      };

      if (estado.tipo === 'indeterminado') {
        return { tipo: 'indeterminado', pacote: pacote.nome, tag, motivo: estado.motivo };
      }
      if (estado.tipo === 'ausente') {
        return { tipo: 'nao-publicado', pacote: pacote.nome, tag };
      }
      // Publicado no npm: o release so e honesto se a tag estiver no remoto.
      return tags.has(tag)
        ? { tipo: 'marcado', pacote: pacote.nome, tag }
        : { tipo: 'sem-tag', pacote: pacote.nome, tag };
    })
    .sort((a, b) => a.pacote.localeCompare(b.pacote));

  return {
    itens,
    dessincronizados: itens.filter((item) => item.tipo === 'sem-tag').length,
    indeterminados: itens.filter((item) => item.tipo === 'indeterminado').length,
  };
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
