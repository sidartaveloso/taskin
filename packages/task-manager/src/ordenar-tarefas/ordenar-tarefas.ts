import type { GroupId, Task } from '@opentask/taskin-types';
import { ancestraisDoGrupo } from '../aninhar-grupos/index.js';

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

/**
 * O que a ordenacao precisa saber, e nada alem disso.
 *
 * Exigir `Task` inteira deixaria a funcao inalcancavel para quem tem outra
 * forma de tarefa — o quadro de priorizacao do dashboard, por exemplo, usa um
 * modelo de tela proprio. Pedir so os dois campos que ela le e o que permite as
 * duas superficies compartilharem a regra em vez de cada uma ter a sua copia.
 *
 * @public
 */
export interface OrdenavelPorPrioridade {
  readonly order?: number;
  readonly difficulty?: number;
}

/**
 * Um grupo na listagem, com o que casou dele: os membros diretos, os
 * subgrupos, e os dois juntos na ordem da fila (task-119).
 *
 * @public
 */
export interface GrupoDaListagem<TTask extends Task = Task> {
  readonly kind: 'group';
  readonly groupId: string;
  /** `undefined` quando o registro nao conhece o grupo. */
  readonly groupName: string | undefined;
  /** O grupo em que este esta; `undefined` na raiz. */
  readonly parentId: string | undefined;
  /** Os membros diretos, sem os dos subgrupos. */
  readonly tasks: readonly TTask[];
  /** Os subgrupos, cada um no lugar do primeiro membro da sua subarvore. */
  readonly groups: readonly GrupoDaListagem<TTask>[];
  /** Membros diretos e subgrupos, intercalados na ordem em que aparecem. */
  readonly items: readonly NoDaListagem<TTask>[];
  /** Quantos membros diretos o filtro deixou de fora. Zero quando o grupo veio inteiro. */
  readonly hidden: number;
}

/** Um no da listagem: uma tarefa solta, ou um grupo com o que casou dele. @public */
export type NoDaListagem<TTask extends Task = Task> =
  | { readonly kind: 'task'; readonly task: TTask }
  | GrupoDaListagem<TTask>;
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
export function ordenarTarefas<TTask extends OrdenavelPorPrioridade>(
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

/** O grupo enquanto se monta: as listas crescem, e so no fim viram leitura. */
interface GrupoEmMontagem<TTask extends Task> {
  kind: 'group';
  groupId: string;
  groupName: string | undefined;
  parentId: string | undefined;
  tasks: TTask[];
  groups: GrupoEmMontagem<TTask>[];
  items: (NoDaListagem<TTask> | GrupoEmMontagem<TTask>)[];
  hidden: number;
}

/**
 * Junta os membros de um grupo num no so, **por identidade**, e cada subgrupo
 * dentro do seu pai.
 *
 * Separado de {@link ordenarTarefas} de proposito. No dashboard as duas coisas
 * vinham juntas porque a arvore existia para desenhar caixas; aqui quem consome
 * decide se quer agrupar.
 *
 * Agrupa pelo `groupId`, e nao por adjacencia: membros separados por um filtro
 * ou por uma ordenacao continuam sendo **um** grupo. Agrupar por adjacencia era
 * o defeito da task-072, que partia o mesmo grupo em dois nos com o mesmo nome.
 *
 * Com `pais`, um grupo entra dentro do seu pai, e o pai ocupa o lugar do
 * primeiro membro da subarvore inteira — o mesmo lugar que a fila lhe da ao
 * mover (task-119). Um pai sem membro direto que case aparece mesmo assim,
 * com `tasks` vazio, porque e ele que contem o subgrupo.
 *
 * @param tarefas - Ja ordenadas; a ordem dos grupos segue a do primeiro membro
 * @param nomes - O que o registro de grupos sabe, por id
 * @param totais - Quantos membros diretos cada grupo tem **antes** do filtro. O
 *   que falta vira `hidden`, para o leitor saber que nao esta vendo o grupo
 *   inteiro em vez de o filtro se alargar sozinho e trazer o resto.
 * @param pais - O pai de cada grupo aninhado, por id. Ausente, todo grupo e da raiz.
 * @public
 */
export function agruparTarefas<TTask extends Task>(
  tarefas: readonly TTask[],
  nomes: Readonly<Record<string, string>> = {},
  totais: Readonly<Record<string, number>> = {},
  pais: Readonly<Record<string, string>> = {},
): NoDaListagem<TTask>[] {
  const raiz: (NoDaListagem<TTask> | GrupoEmMontagem<TTask>)[] = [];
  const porGrupo = new Map<string, GrupoEmMontagem<TTask>>();
  const hierarquia = Object.entries(pais).map(([id, parentId]) => ({ id, parentId })) as unknown as Parameters<
    typeof ancestraisDoGrupo
  >[0];

  /* O no do grupo, criado — com os ancestrais — no primeiro membro que aparecer. */
  const grupo = (id: string): GrupoEmMontagem<TTask> => {
    const existente = porGrupo.get(id);
    if (existente) return existente;

    const [acimaDele] = ancestraisDoGrupo(hierarquia, id as GroupId).map(String);
    // Num ciclo gravado (o `lint` acusa), o grupo fica na raiz em vez de sumir.
    const emCiclo =
      acimaDele !== undefined &&
      ancestraisDoGrupo(hierarquia, acimaDele as GroupId)
        .map(String)
        .includes(id);
    const pai = emCiclo ? undefined : acimaDele;
    const novo: GrupoEmMontagem<TTask> = {
      kind: 'group',
      groupId: id,
      groupName: nomes[id],
      parentId: pai,
      tasks: [],
      groups: [],
      items: [],
      hidden: 0,
    };
    porGrupo.set(id, novo);

    if (pai === undefined) {
      raiz.push(novo);
    } else {
      const acima = grupo(pai);
      acima.groups.push(novo);
      acima.items.push(novo);
    }
    return novo;
  };

  for (const task of tarefas) {
    if (task.groupId === undefined) {
      raiz.push({ kind: 'task', task });
      continue;
    }
    const dono = grupo(String(task.groupId));
    dono.tasks.push(task);
    dono.items.push({ kind: 'task', task });
  }

  for (const no of porGrupo.values()) {
    no.hidden = Math.max(0, (totais[no.groupId] ?? no.tasks.length) - no.tasks.length);
  }

  return raiz as NoDaListagem<TTask>[];
}
