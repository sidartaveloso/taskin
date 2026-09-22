import { tagEsperada } from '../reconciliador-de-tags/reconciliador-de-tags';
import type { EstadoNoRegistry, ItemDeMarco, PacotePublicavel, PlanoDeMarcos } from './sincronizador-de-marcos.types';

/**
 * Decide o marco (tag + Release) de cada pacote a partir de dois fatos externos
 * — a versao esta no npm? a tag esta no remoto? — e nunca do que a passada de
 * `changeset publish` reportou ter feito. Foi justamente confiar no relatorio do
 * publish (que imprimiu "Created git tags" sem empurrar nada) que deixou o
 * release de 06/09 verde com o repositorio 12 versoes atras do registry.
 *
 * Por derivar do estado real, o plano e idempotente: um retry sobre o mesmo
 * estado produz o mesmo plano e preenche exatamente os buracos que sobraram.
 *
 * @param estadosNoNpm estado de CADA pacote na SUA versao atual (consulta a
 *   `nome@versao`), nao a `latest` do pacote. Um pacote sem entrada e tratado
 *   como indeterminado — nao da para marcar sem ter perguntado.
 */
export function planejarMarcos(
  pacotes: PacotePublicavel[],
  estadosNoNpm: Map<string, EstadoNoRegistry>,
  tagsRemotas: Iterable<string>,
): PlanoDeMarcos {
  const tags = tagsRemotas instanceof Set ? tagsRemotas : new Set(tagsRemotas);

  const itens: ItemDeMarco[] = pacotes
    .map((pacote): ItemDeMarco => {
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
      // Publicado no npm: o marco existe se, e so se, a tag estiver no remoto.
      return tags.has(tag)
        ? { tipo: 'ja-marcado', pacote: pacote.nome, tag }
        : { tipo: 'a-marcar', pacote: pacote.nome, tag };
    })
    .sort((a, b) => a.pacote.localeCompare(b.pacote));

  return {
    itens,
    aMarcar: itens.filter((item): item is Extract<ItemDeMarco, { tipo: 'a-marcar' }> => item.tipo === 'a-marcar'),
    indeterminados: itens.filter((item) => item.tipo === 'indeterminado').length,
  };
}
