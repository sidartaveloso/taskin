import type { Task } from '@opentask/taskin-types';

/**
 * Passo largo de proposito.
 *
 * Com 100 cabem muitos movimentos entre dois vizinhos antes de a renumeracao
 * local precisar acontecer. Com 10 — o passo que o quadro de priorizacao usava —
 * o espaco acaba depressa, e cada esgotamento custa escrita em arquivo.
 */
export const PASSO_DE_PRIORIDADE = 100;

/**
 * Devolve as tarefas que precisam de um `order` novo, e so elas.
 *
 * ## Por que isto existe
 *
 * O custo de reordenar no quadro de priorizacao ja e de um arquivo por
 * movimento — **exceto** num projeto meio numerado. Ali, dar numero a uma tarefa
 * do meio obriga a numerar todos os antecessores, porque uma tarefa sem `order`
 * ordena por ultimo e nao tem posicao propria entre as numeradas. Num projeto de
 * 500 tarefas com metade sem numero, isso chegou a 124 arquivos.
 *
 * A saida nao e um algoritmo mais esperto: e acabar com o estado meio numerado.
 * Depois desta passada, ou o projeto inteiro tem numero, ou nunca foi priorizado
 * — e todo movimento seguinte custa um arquivo.
 *
 * ## O que ela preserva
 *
 * A ordem relativa em que as tarefas chegaram, e o numero de quem ja tem um.
 * Quem priorizou tomou uma decisao; o comando preenche as lacunas em volta dela
 * em vez de reescreve-la.
 *
 * @param tarefas - Na ordem em que devem ficar
 * @returns Copias apenas das tarefas que mudaram, prontas para gravar. Vazio
 *   quando nao ha nada a fazer — o que torna uma segunda passada inofensiva.
 * @public
 */
export function numerarPrioridade(tarefas: readonly Task[], passo = PASSO_DE_PRIORIDADE): Task[] {
  const mudancas: Task[] = [];
  let anterior = 0;

  for (let i = 0; i < tarefas.length; i++) {
    const atual = tarefas[i];
    if (!atual) continue;

    if (atual.order !== undefined && atual.order > anterior) {
      anterior = atual.order;
      continue;
    }

    /*
     * Precisa de numero. O teto e o proximo valor ja existente que ainda esta a
     * frente — respeita-lo e o que preserva a decisao de quem priorizou.
     */
    const teto = tarefas.slice(i + 1).find((t) => t?.order !== undefined && t.order > anterior)?.order;
    const valor = teto === undefined ? anterior + passo : Math.floor((anterior + teto) / 2);

    if (!(valor > anterior) || (teto !== undefined && valor >= teto)) {
      /*
       * Sem espaco entre os vizinhos: abre espaco andando para a frente e para
       * no primeiro que ja estiver alem. A renumeracao fica na vizinhanca.
       */
      let corrido = anterior;
      let j = i;
      for (; j < tarefas.length; j++) {
        const item = tarefas[j];
        if (!item) continue;
        if (j > i && item.order !== undefined && item.order > corrido) break;
        corrido += passo;
        mudancas.push({ ...item, order: corrido });
      }
      anterior = corrido;
      // Quem a caminhada ja renumerou nao passa pelo laco de novo.
      i = j - 1;
      continue;
    }

    mudancas.push({ ...atual, order: valor });
    anterior = valor;
  }

  return mudancas;
}
