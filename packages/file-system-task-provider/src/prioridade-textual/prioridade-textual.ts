import { PASSO_DE_PRIORIDADE } from '@opentask/taskin-task-manager';
import { detectLocale, getI18n } from '../i18n.js';
import { readMetadataField, writeMetadataField } from '../metadata-style/index.js';

/**
 * Os niveis que as pessoas escrevem no lugar do numero, do mais urgente para o
 * menos.
 *
 * Vocabulario fechado de proposito: so entra palavra cuja posicao relativa
 * ninguem discute. Fora dele o `--fix` nao opina — `Priority: amanha` continua
 * erro, porque traduzir isso seria adivinhar.
 */
const NIVEIS: readonly (readonly string[])[] = [
  ['critical', 'critica', 'urgent', 'urgente', 'highest'],
  ['high', 'alta'],
  ['medium', 'media', 'normal'],
  ['low', 'baixa', 'lowest'],
];

/**
 * A posicao do nivel escrito, ou `undefined` quando a palavra nao e um nivel.
 *
 * Caixa e acento nao contam: `Média` e `media` sao a mesma decisao.
 *
 * @public
 */
export function nivelDaPrioridade(valor: string): number | undefined {
  const palavra = valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  const nivel = NIVEIS.findIndex((sinonimos) => sinonimos.includes(palavra));
  return nivel < 0 ? undefined : nivel;
}

/** Uma tarefa como o `--fix` a ve: o arquivo e o `Priority` cru, como escrito. */
export interface PrioridadeLida {
  readonly file: string;
  readonly prioridade: string | undefined;
}

/** Um `Priority` escrito por extenso, e o numero que ele vira. */
export interface ConversaoDePrioridade {
  readonly file: string;
  readonly de: string;
  readonly para: number;
}

/**
 * Decide o numero de cada `Priority` escrito como nivel.
 *
 * ## O que e decidido, e o que nao e
 *
 * `high` numa tarefa e `low` noutra ja dizem qual vem antes; isso e so
 * traduzido. Dentro do mesmo nivel vale a ordem de chegada — a mesma que o
 * quadro ja usa para desempatar, entao nada muda de lugar na tela.
 *
 * Quem ja tem numero nao e tocado (task-078: renumerar a fila e decisao humana).
 * As convertidas entram **depois** do maior numero existente, porque e onde uma
 * tarefa sem numero ja aparece hoje. Um `high` num projeto numerado fica no fim
 * da fila, como ja estava; subir e com `taskin priority`.
 *
 * @param tarefas - Na ordem em que o provider as devolve
 * @returns So as que mudam. Vazio quando nao ha nivel escrito por extenso.
 * @public
 */
export function planejarPrioridadesTextuais(
  tarefas: readonly PrioridadeLida[],
  passo = PASSO_DE_PRIORIDADE,
): ConversaoDePrioridade[] {
  const numeros = tarefas.map((t) => Number(t.prioridade?.trim())).filter(Number.isFinite);
  let anterior = numeros.length > 0 ? Math.max(...numeros) : 0;

  const porNivel = tarefas.flatMap((t) => {
    if (t.prioridade === undefined) return [];
    const nivel = nivelDaPrioridade(t.prioridade);
    return nivel === undefined ? [] : [{ file: t.file, de: t.prioridade.trim(), nivel }];
  });

  // `sort` e estavel: dentro do mesmo nivel, fica a ordem de chegada.
  return porNivel
    .sort((a, b) => a.nivel - b.nivel)
    .map(({ file, de }) => {
      anterior += passo;
      return { file, de, para: anterior };
    });
}

/**
 * Grava no arquivo o numero de cada `Priority` escrito como nivel.
 *
 * So a linha do campo muda, no estilo de metadado que o arquivo ja usa e com o
 * rotulo que ele ja tem — `Prioridade` num arquivo em portugues continua
 * `Prioridade`.
 *
 * @returns As conversoes que de fato foram gravadas
 * @public
 */
export async function corrigirPrioridadesTextuais(
  tarefas: readonly PrioridadeLida[],
  io: { readFile: (path: string) => Promise<string>; writeFile: (path: string, content: string) => Promise<void> },
): Promise<ConversaoDePrioridade[]> {
  const gravadas: ConversaoDePrioridade[] = [];

  for (const conversao of planejarPrioridadesTextuais(tarefas)) {
    const conteudo = await io.readFile(conversao.file);
    const i18n = getI18n(detectLocale(conteudo));
    const rotulo = readMetadataField(conteudo, i18n.priority) === undefined ? 'Priority' : i18n.priority;
    const novo = writeMetadataField(conteudo, rotulo, String(conversao.para));

    if (novo !== conteudo) {
      await io.writeFile(conversao.file, novo);
      gravadas.push(conversao);
    }
  }

  return gravadas;
}
