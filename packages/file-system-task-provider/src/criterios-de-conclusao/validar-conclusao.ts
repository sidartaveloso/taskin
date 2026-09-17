import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { criteriosEmAberto } from './criterios-de-conclusao.js';

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

  return criteriosEmAberto(conteudo).map((criterio) => ({
    file: filePath,
    line: criterio.linha,
    message:
      `Task is ${status} but "${criterio.texto}" is still open. ` +
      'Tick it, or say why it was dropped: "— adiado: <reason>".',
    severity: 'error' as const,
  }));
}
