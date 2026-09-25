import { tagEsperada } from '../reconciliador-de-tags/reconciliador-de-tags';
import type {
  ConsultarVersao,
  EstadoNoRegistry,
  OpcoesDeEspera,
  PacotePublicavel,
} from './espera-pela-publicacao.types';

/**
 * O teto medido no release de 21/09 foi 150s entre o `Successfully published`
 * e a ultima das doze versoes responder 200 no registry. Dez tentativas de 30s
 * cobrem o dobro disso.
 */
export const ESPERA_PADRAO = { tentativas: 10, intervaloMs: 30_000 } as const;

export const dormirDeVerdade = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * Le o output `publishedPackages` da changesets/action — um JSON
 * `[{ "name", "version" }]` — e devolve as tags `nome@versao` que o publish
 * disse ter publicado. Vazio (a action nao publicou, ou o passo rodou fora do
 * workflow) vira conjunto vazio: sem expectativa, nao ha pelo que esperar.
 */
export function parsearPacotesPublicados(bruto: string | undefined): Set<string> {
  if (!bruto?.trim()) return new Set();
  const lista: unknown = JSON.parse(bruto);
  if (!Array.isArray(lista)) throw new Error(`publishedPackages nao e uma lista: ${bruto}`);

  return new Set(
    lista.map((item) => {
      const { name, version } = (item ?? {}) as { name?: unknown; version?: unknown };
      if (typeof name !== 'string' || typeof version !== 'string') {
        throw new Error(`item de publishedPackages sem name/version: ${JSON.stringify(item)}`);
      }
      return tagEsperada({ nome: name, versao: version });
    }),
  );
}

/**
 * Pergunta ao npm o estado de cada pacote e, para os que o publish disse ter
 * publicado, insiste ate aparecerem ou ate as tentativas acabarem.
 *
 * O caminho de escrita do registry responde na hora e o de leitura nao: logo
 * apos o publish, "nao esta no npm" pode ser so "ainda nao propagou". Por isso
 * so se espera pelo que esta em `esperados` — um pacote que o publish nao
 * reportou e consultado uma unica vez, e a ausencia dele continua sendo
 * resposta. A decisao final segue vindo do registry (task-047): esta funcao so
 * escolhe o momento de perguntar.
 */
export async function consultarEsperando(
  pacotes: PacotePublicavel[],
  esperados: ReadonlySet<string>,
  consultar: ConsultarVersao,
  opcoes: OpcoesDeEspera,
): Promise<Map<string, EstadoNoRegistry>> {
  const estados = new Map<string, EstadoNoRegistry>();
  let pendentes = pacotes;

  for (let tentativa = 1; ; tentativa++) {
    const respostas = await Promise.all(
      pendentes.map(async (pacote) => [pacote, await consultar(pacote.nome, pacote.versao)] as const),
    );
    for (const [pacote, estado] of respostas) estados.set(pacote.nome, estado);

    pendentes = respostas
      .filter(([pacote, estado]) => estado.tipo !== 'publicado' && esperados.has(tagEsperada(pacote)))
      .map(([pacote]) => pacote);

    if (pendentes.length === 0 || tentativa >= opcoes.tentativas) return estados;

    opcoes.aoEsperar?.(pendentes.map(tagEsperada), tentativa + 1, opcoes.tentativas);
    await opcoes.dormir(opcoes.intervaloMs);
  }
}
