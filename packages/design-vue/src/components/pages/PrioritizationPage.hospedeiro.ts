import { posicionarGrupo, posicionarPrioridade } from '@opentask/taskin-task-manager';
import { defineComponent, h, type PropType, ref } from 'vue';
import type { GrupoDoQuadro, MovimentoDoQuadro, MudancaDeGrupo } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import PrioritizationPage from './PrioritizationPage.vue';

/*
 * O hospedeiro da pagina de priorizacao fora do dashboard — nas stories e no
 * teste que cobre o mesmo fluxo em jsdom.
 *
 * Desde a task-118 a pagina nao numera: ela emite `move`, quem a hospeda manda
 * o movimento ao dominio, e a lista que volta traz a nova ordem. Desde a
 * task-119 ela tambem emite `update-group` — criar um subgrupo, aninhar um
 * grupo em outro —, e os grupos voltam como prop, com o pai de cada um. No
 * dashboard quem faz isso e o servidor WebSocket; aqui, este hospedeiro, com
 * as mesmas regras puras do dominio.
 */

type TarefaDoDominio = Parameters<typeof posicionarPrioridade>[0][number];
type Hierarquia = NonNullable<Parameters<typeof posicionarGrupo>[3]>;

const grupoDe = (t: Task) => (t.parent?.type === 'group' ? t.parent.id : undefined);

/** Aplica um movimento como o servidor aplica: pela regra do dominio, devolvendo a lista inteira. */
export function aplicarMovimento(tarefas: Task[], movimento: MovimentoDoQuadro, grupos: GrupoDoQuadro[] = []): Task[] {
  const dominio = tarefas.map((t) => ({
    id: t.id,
    order: t.order,
    groupId: grupoDe(t),
  })) as unknown as TarefaDoDominio[];
  const hierarquia = grupos as unknown as Hierarquia;
  const alvoEGrupo =
    tarefas.some((t) => grupoDe(t) === movimento.targetId) || grupos.some((g) => g.id === movimento.targetId);

  const mudadas =
    movimento.kind === 'task'
      ? posicionarPrioridade(dominio, movimento.id as never, movimento.targetId as never, movimento.lado)
      : posicionarGrupo(
          dominio,
          movimento.id as never,
          {
            lado: movimento.lado,
            alvo: alvoEGrupo ? { groupId: movimento.targetId as never } : { taskId: movimento.targetId as never },
          },
          hierarquia,
        );

  const novaOrdem = new Map(mudadas.map((t) => [String(t.id), t.order]));
  return tarefas.map((t) => (novaOrdem.has(String(t.id)) ? { ...t, order: novaOrdem.get(String(t.id)) } : t));
}

/** Grava um grupo como o registro grava: o novo entra, o existente muda de pai. */
export function aplicarMudancaDeGrupo(grupos: GrupoDoQuadro[], mudanca: MudancaDeGrupo): GrupoDoQuadro[] {
  const gravado: GrupoDoQuadro = {
    id: mudanca.id,
    name: mudanca.name,
    ...(mudanca.parentId && { parentId: mudanca.parentId }),
  };
  return grupos.some((g) => g.id === mudanca.id)
    ? grupos.map((g) => (g.id === mudanca.id ? { ...gravado, name: g.name ?? gravado.name } : g))
    : [...grupos, gravado];
}

/** A pagina com um hospedeiro que grava o que ela emite, como o `App.vue` do dashboard. */
export const PaginaHospedada = defineComponent({
  name: 'PaginaHospedada',
  props: {
    tasks: { type: Array as PropType<Task[]>, required: true },
    groups: { type: Array as PropType<GrupoDoQuadro[]>, default: () => [] },
  },
  setup(props) {
    const tarefas = ref<Task[]>([...props.tasks]);
    const grupos = ref<GrupoDoQuadro[]>([...props.groups]);
    const gravar = (task: Task) => {
      tarefas.value = tarefas.value.map((t) => (t.id === task.id ? task : t));
    };
    const gravarGrupo = (mudanca: MudancaDeGrupo) => {
      grupos.value = aplicarMudancaDeGrupo(grupos.value, mudanca);
    };
    const mover = (movimento: MovimentoDoQuadro) => {
      tarefas.value = aplicarMovimento(tarefas.value, movimento, grupos.value);
    };
    return () =>
      h(PrioritizationPage, {
        tasks: tarefas.value,
        groups: grupos.value,
        onUpdateTask: gravar,
        onUpdateGroup: gravarGrupo,
        onMove: mover,
      });
  },
});
