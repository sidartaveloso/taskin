import type { ITaskManager } from '../task-manager.types';

/** As chaves de `T` que sao funcoes — opcionais inclusive. */
type Funcoes<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends (...args: never[]) => unknown ? K : never;
}[keyof T];

/**
 * Cada operacao do {@link ITaskManager}. `groupRegistry` fica de fora por ser
 * um sub-contrato, com as proprias operacoes.
 *
 * @public
 */
export type OperacaoDoManager = Funcoes<ITaskManager>;

/**
 * Como uma superficie expoe uma operacao: pelo nome que ela tem ali — o
 * comando da CLI, a ferramenta do MCP, a mensagem do WebSocket — ou ausente,
 * com o motivo escrito.
 *
 * Nao ha terceira forma. A ausencia pode ser decidida; o que nao pode e
 * acontecer por omissao, sem ninguem decidir.
 *
 * @public
 */
export type Exposicao = { readonly nome: string } | { readonly ausente: string };

/** As tres superficies, e como cada uma expoe uma operacao. @public */
export interface SuperficiesDaOperacao {
  readonly cli: Exposicao;
  readonly mcp: Exposicao;
  readonly ws: Exposicao;
}

/** @public */
export type Superficie = keyof SuperficiesDaOperacao;

const SO_NA_CLI = 'o dashboard e o MCP leem e escrevem tarefas que ja existem; criar e validar arquivos e da CLI';

/**
 * Onde cada operacao do {@link ITaskManager} aparece, gateado a cobrir
 * **todas**.
 *
 * O mesmo portao do `FILTER_CRITERIA_SURFACES`, agora para operacoes: o
 * `satisfies Record<OperacaoDoManager, ...>` faz com que acrescentar uma
 * operacao ao contrato sem decidir as tres superficies nao compile. E o nome de
 * cada superficie e de onde ela deriva o que atende — o servidor WebSocket tipa
 * os seus handlers por {@link NomeNaSuperficie}, e esquecer um nao compila.
 *
 * Ver `docs/RDT/superficies-derivam-do-mesmo-contrato.md`.
 *
 * @public
 */
export const SUPERFICIES_DAS_OPERACOES = {
  getAllTasks: { cli: { nome: 'list' }, mcp: { nome: 'list_tasks' }, ws: { nome: 'list' } },
  createTask: { cli: { nome: 'new' }, mcp: { ausente: SO_NA_CLI }, ws: { ausente: SO_NA_CLI } },
  lint: { cli: { nome: 'lint' }, mcp: { ausente: SO_NA_CLI }, ws: { ausente: SO_NA_CLI } },
  startTask: { cli: { nome: 'start' }, mcp: { nome: 'start_task' }, ws: { nome: 'start' } },
  pauseTask: {
    cli: { nome: 'pause' },
    mcp: { ausente: 'o agente comeca e termina; pausar e gesto de gente, ninguem pediu no MCP' },
    ws: { nome: 'pause' },
  },
  reviewTask: {
    cli: { nome: 'review' },
    mcp: { ausente: 'o fluxo do agente fecha a task direto; ninguem pediu revisao pelo MCP' },
    ws: { ausente: 'o quadro ainda nao tem o gesto de mandar para revisao' },
  },
  finishTask: {
    cli: { ausente: 'a CLI conclui por finishTaskComRelato, que avisa o que ficou em aberto' },
    mcp: { ausente: 'o MCP conclui por finishTaskComRelato, que avisa o que ficou em aberto' },
    ws: { nome: 'finish' },
  },
  finishTaskComRelato: {
    cli: { nome: 'finish' },
    mcp: { nome: 'finish_task' },
    ws: { ausente: 'o quadro ainda nao tem onde mostrar o relato; conclui por finishTask' },
  },
  getCompletionBlockers: {
    cli: { ausente: 'chega junto do finish, pelo relato de finishTaskComRelato' },
    mcp: { ausente: 'chega junto do finish_task, pelo relato de finishTaskComRelato' },
    ws: { ausente: 'o quadro ainda nao mostra criterios em aberto' },
  },
  prioritizeAll: {
    cli: { nome: 'prioritize' },
    mcp: { nome: 'prioritize_tasks' },
    ws: { ausente: 'o dashboard numera pelo POST /api/prioritize do proprio servidor HTTP' },
  },
  assignToGroup: { cli: { nome: 'group join' }, mcp: { nome: 'join_group' }, ws: { nome: 'assign-to-group' } },
  removeFromGroup: { cli: { nome: 'group leave' }, mcp: { nome: 'leave_group' }, ws: { nome: 'remove-from-group' } },
  setPriority: { cli: { nome: 'priority' }, mcp: { nome: 'set_priority' }, ws: { nome: 'set-priority' } },
  moveBefore: { cli: { nome: 'priority' }, mcp: { nome: 'set_priority' }, ws: { nome: 'move-before' } },
  moveAfter: { cli: { nome: 'priority' }, mcp: { nome: 'set_priority' }, ws: { nome: 'move-after' } },
  moveToTop: { cli: { nome: 'priority' }, mcp: { nome: 'set_priority' }, ws: { nome: 'move-to-top' } },
  moveToBottom: { cli: { nome: 'priority' }, mcp: { nome: 'set_priority' }, ws: { nome: 'move-to-bottom' } },
  moveGroupBefore: { cli: { nome: 'group move' }, mcp: { nome: 'move_group' }, ws: { nome: 'move-group-before' } },
  moveGroupAfter: { cli: { nome: 'group move' }, mcp: { nome: 'move_group' }, ws: { nome: 'move-group-after' } },
  moveGroupToTop: { cli: { nome: 'group move' }, mcp: { nome: 'move_group' }, ws: { nome: 'move-group-to-top' } },
  moveGroupToBottom: {
    cli: { nome: 'group move' },
    mcp: { nome: 'move_group' },
    ws: { nome: 'move-group-to-bottom' },
  },
  setDifficulty: { cli: { nome: 'difficulty' }, mcp: { nome: 'set_difficulty' }, ws: { nome: 'set-difficulty' } },
} as const satisfies Record<OperacaoDoManager, SuperficiesDaOperacao>;

type Tabela = typeof SUPERFICIES_DAS_OPERACOES;

/**
 * Os nomes que uma superficie precisa atender, como tipo — para ela tipar o
 * que atende por aqui e o esquecimento virar erro de compilacao.
 *
 * @public
 */
export type NomeNaSuperficie<S extends Superficie> = {
  [K in keyof Tabela]: Tabela[K][S] extends { readonly nome: infer N extends string } ? N : never;
}[keyof Tabela];

/**
 * Os mesmos nomes, em tempo de execucao, sem repeticao — para a superficie que
 * so pode ser conferida rodando (os comandos da CLI, as ferramentas do MCP).
 *
 * @public
 */
export function nomesNaSuperficie<S extends Superficie>(superficie: S): NomeNaSuperficie<S>[] {
  const nomes = Object.values(SUPERFICIES_DAS_OPERACOES).flatMap((s) => {
    const exposicao: Exposicao = s[superficie];
    return 'nome' in exposicao ? [exposicao.nome as NomeNaSuperficie<S>] : [];
  });
  return [...new Set(nomes)];
}
