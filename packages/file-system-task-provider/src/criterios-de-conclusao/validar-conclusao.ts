import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { anotacaoDeAdiamento, criteriosEmAberto } from './criterios-de-conclusao.js';

/**
 * So `done` exige o checklist.
 *
 * `canceled` tambem encerra a tarefa, mas significa **abandonada** — exigir
 * itens marcados ali seria absurdo: ninguem cancela uma tarefa depois de
 * termina-la. A primeira versao desta funcao tratava os dois igual, e o teste
 * pegou.
 */
const EXIGE_CHECKLIST = ['done'];

function statusDe(conteudo: string): string | undefined {
  return conteudo.match(/^\s*(?:-\s*)?(?:Status|Situação)\s*:\s*(\S+)/im)?.[1]?.toLowerCase();
}

/**
 * Recusa uma tarefa encerrada que ainda tem criterio em aberto sem justificativa.
 *
 * ## De onde isto vem
 *
 * De uma auditoria real. Das oito tarefas fechadas por agentes autonomos em 12 e
 * 13/09, **quatro** constavam como `done` com o checklist inteiro em aberto. Em
 * todas elas o trabalho estava feito e coberto por testes — mas o arquivo nao
 * mostrava nada disso, e quem revisou nao tinha por onde comecar. Numa delas, a
 * auditoria descobriu que um item de fato **nao** tinha sido feito, escondido
 * entre os outros cinco.
 *
 * Um `Status: done` sem evidencia e indistinguivel de alguem que desistiu e
 * fechou.
 *
 * ## Por que erro, e por que aqui
 *
 * Erro, e nao aviso: isto roda em CI, e o que o CI nao quebra ninguem arruma.
 *
 * E no `lint`, e nao no `finish`: fechar uma tarefa e um gesto que acontece uma
 * vez, muitas vezes com pressa, e recusa-lo ali torna o comando fragil. O lint
 * ve o repositorio inteiro, roda sem pressa, e quebra o build — que e onde a
 * exigencia aguenta ser dura.
 *
 * ## O que ele **nao** recusa
 *
 * Item adiado com razao escrita. Fechar uma tarefa decidindo nao fazer um item e
 * legitimo — a task-047 foi pausada assim, e a task-065 adiou um item de
 * proposito, e as duas estavam certas. O que se exige e que a decisao esteja
 * escrita, nao que ela nao exista.
 *
 * @public
 */
export function validarConclusao(filePath: string, conteudo: string): ValidationIssue[] {
  const status = statusDe(conteudo);
  if (status === undefined || !EXIGE_CHECKLIST.includes(status)) return [];

  return criteriosEmAberto(conteudo).map((criterio) => {
    const anotacao = anotacaoDeAdiamento(criterio.texto);
    return {
      file: filePath,
      line: criterio.linha,
      message:
        `Task is ${status} but "${criterio.texto}" is still open. ` +
        'Tick it, or say why it was dropped: "— adiado: <reason>".',
      severity: 'error' as const,
      ...(anotacao
        ? { suggestion: `Its own note says it was left out — lint --fix rewrites it as "— adiado: ${anotacao.razao}".` }
        : {
            fixable: false,
            suggestion: 'Only you know which it was: tick it if it was done, or write "— adiado: <reason>" if not.',
          }),
    };
  });
}

/** Um item que o `--fix` passou de aberto para adiado. */
export interface ItemAdiado {
  readonly linha: number;
  readonly texto: string;
  readonly razao: string;
}

/**
 * Reescreve como `— adiado: <razao>` o item em aberto que ja se anota como fora.
 *
 * So toca tarefa `done`, que e onde o portao cobra, e so item cuja anotacao
 * `anotacaoDeAdiamento` reconhece. A anotacao sai do texto e vira a razao,
 * palavra por palavra; linhas de continuacao ficam onde estao.
 *
 * **Nunca** marca `[x]`, e nunca adia item sem anotacao: so quem fez sabe se
 * fez, e um item nao feito escondido entre os feitos foi exatamente o que a
 * auditoria da task-075 achou.
 *
 * @returns O conteudo, igual ao de entrada quando nao ha o que fazer, e os itens
 *   adiados
 * @public
 */
export function corrigirConclusao(conteudo: string): { conteudo: string; adiados: ItemAdiado[] } {
  const status = statusDe(conteudo);
  if (status === undefined || !EXIGE_CHECKLIST.includes(status)) return { conteudo, adiados: [] };

  const linhas = conteudo.split('\n');
  const adiados: ItemAdiado[] = [];

  for (const criterio of criteriosEmAberto(conteudo)) {
    const anotacao = anotacaoDeAdiamento(criterio.texto);
    const marca = linhas[criterio.linha - 1]?.match(/^(\s*[-*]\s*\[ \]\s*)/)?.[1];
    if (!anotacao || marca === undefined) continue;

    linhas[criterio.linha - 1] = `${marca}${anotacao.texto} — adiado: ${anotacao.razao}`;
    adiados.push({ linha: criterio.linha, ...anotacao });
  }

  return adiados.length === 0 ? { conteudo, adiados } : { conteudo: linhas.join('\n'), adiados };
}
