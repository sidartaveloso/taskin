import type { Task } from '@opentask/taskin-types';

/**
 * Como uma listagem pode ser ordenada.
 *
 * O mesmo vocabulario que o quadro de priorizacao do dashboard usa. Manter as
 * grafias iguais entre as superficies vale mais que elegancia local: quem le a
 * documentacao de uma reconhece a outra.
 *
 * @public
 */
export type ModoDeOrdenacao = 'manual' | 'diff-asc' | 'diff-desc';

/** Um no da listagem: uma tarefa solta, ou um grupo com os membros que casaram. */
export type NoDaListagem<TTask extends Task = Task> =
  | { readonly kind: 'task'; readonly task: TTask }
  | {
      readonly kind: 'group';
      readonly groupId: string;
      /** `undefined` quando o registro nao conhece o grupo. */
      readonly groupName: string | undefined;
      readonly tasks: readonly TTask[];
      /** Quantos membros o filtro deixou de fora. Zero quando o grupo veio inteiro. */
      readonly hidden: number;
    };

/**
 * Ordena uma listagem, sem alterar a lista recebida.
 *
 * Vivia dentro do pacote Vue do dashboard, inalcancavel para a CLI e para o
 * servidor MCP — e por isso `taskin list` devolvia as tarefas na ordem em que o
 * provider as achava, que na pratica e por id.
 *
 * `manual` usa o `order`, com quem nao tem por ultimo e estabilidade no resto.
 * Os dois modos de dificuldade usam o `difficulty`.
 *
 * @public
 */
export function ordenarTarefas<TTask extends Task>(
  tarefas: readonly TTask[],
  modo: ModoDeOrdenacao = 'manual',
): TTask[] {
  const comIndice = tarefas.map((task, index) => ({ task, index }));

  const campo = (t: TTask) => (modo === 'manual' ? t.order : t.difficulty);
  const sinal = modo === 'diff-desc' ? -1 : 1;

  comIndice.sort((a, b) => {
    const va = campo(a.task);
    const vb = campo(b.task);

    // Quem nao tem valor vai para o fim, qualquer que seja a direcao.
    if (va === undefined && vb === undefined) return a.index - b.index;
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    if (va !== vb) return (va - vb) * sinal;

    return a.index - b.index;
  });

  return comIndice.map(({ task }) => task);
}

/**
 * Junta os membros de um grupo num no so, **por identidade**.
 *
 * Separado de {@link ordenarTarefas} de proposito. No dashboard as duas coisas
 * vinham juntas porque a arvore existia para desenhar caixas; aqui quem consome
 * decide se quer agrupar.
 *
 * Agrupa pelo `groupId`, e nao por adjacencia: membros separados por um filtro
 * ou por uma ordenacao continuam sendo **um** grupo. Agrupar por adjacencia era
 * o defeito da task-072, que partia o mesmo grupo em dois nos com o mesmo nome.
 *
 * @param tarefas - Ja ordenadas; a ordem dos grupos segue a do primeiro membro
 * @param nomes - O que o registro de grupos sabe, por id
 * @param totais - Quantos membros cada grupo tem **antes** do filtro. O que
 *   falta vira `hidden`, para o leitor saber que nao esta vendo o grupo inteiro
 *   em vez de o filtro se alargar sozinho e trazer o resto.
 * @public
 */
export function agruparTarefas<TTask extends Task>(
  tarefas: readonly TTask[],
  nomes: Readonly<Record<string, string>> = {},
  totais: Readonly<Record<string, number>> = {},
): NoDaListagem<TTask>[] {
  const nos: NoDaListagem<TTask>[] = [];
  const porGrupo = new Map<string, TTask[]>();

  for (const task of tarefas) {
    const id = task.groupId === undefined ? undefined : String(task.groupId);

    if (id === undefined) {
      nos.push({ kind: 'task', task });
      continue;
    }

    const existente = porGrupo.get(id);
    if (existente) {
      existente.push(task);
      continue;
    }

    const membros = [task];
    porGrupo.set(id, membros);
    nos.push({
      kind: 'group',
      groupId: id,
      groupName: nomes[id],
      tasks: membros,
      hidden: 0,
    });
  }

  return nos.map((no) =>
    no.kind === 'group'
      ? { ...no, hidden: Math.max(0, (totais[no.groupId] ?? no.tasks.length) - no.tasks.length) }
      : no,
  );
}
