<template>
  <div v-if="semPrioridade > 0" class="aviso-prioridade">
    <span>
      <strong>{{ semPrioridade }}</strong> tarefa(s) ainda sem prioridade. Enquanto o projeto
      estiver meio numerado, mover uma tarefa reescreve todos os arquivos antes dela.
    </span>
    <button type="button" :disabled="numerando" @click="numerarTudo">
      {{ numerando ? 'Numerando…' : 'Numerar agora' }}
    </button>
  </div>

  <TaskinWorkspace
    :tasks="tasks"
    :total="taskStore.tasks.length"
    :groups="gruposDoQuadro"
    :view="mode"
    :filter="filtroEfetivo"
    :search="busca"
    :sort="ordem"
    :score="pontuacao"
    :connection-status="connectionStatusType"
    :status-text="statusText"
    :connection-error="connectionError ?? ''"
    :is-loading="isLoading"
    @update:view="escolherTela"
    @update:filter="escolherFiltro"
    @update:search="escolherBusca"
    @update:sort="escolherOrdem"
    @update:score="escolherPontuacao"
    @retry="handleRefresh"
    @update-task="handleUpdateTask"
    @update-group="handleUpdateGroup"
    @move="handleMove"
  />
</template>

<script setup lang="ts">
import type {
  GrupoDoQuadro,
  MovimentoDoQuadro,
  MudancaDeGrupo,
  Task,
  TaskStatus,
  WorkspaceFilter,
  WorkspaceScore,
  WorkspaceSort,
  WorkspaceView,
} from '@opentask/taskin-design-vue';
import {
  groupId,
  TaskinWorkspace,
  WORKSPACE_FILTERS,
  WORKSPACE_SCORES,
  WORKSPACE_SORTS,
  WORKSPACE_VIEWS,
} from '@opentask/taskin-design-vue';
import {
  effectiveFilterCriteria,
  filterTasks,
  ordenarTarefas,
  type TaskFilterCriteria,
} from '@opentask/taskin-task-manager';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NOME_DE_GRUPO_NOVO, operacaoDoGrupo, operacaoDoMovimento, operacoesDaMudanca } from './operacoes-da-mudanca';

// Progress bar filled per status.
//
// This map is where the domain's status union and the design system's have to
// agree, and it checks both directions: annotating it `Record<TaskStatus, …>`
// means a status added to the design system must be handled here, and indexing
// it with the store's status (below) means a status added to the domain must be
// renderable. Neither side can grow a status the other silently ignores — which
// is how `paused` sat in the design system, unreachable, for so long.
const PROGRESS_BY_STATUS: Record<TaskStatus, number> = {
  pending: 0,
  'in-progress': 50,
  paused: 30,
  'in-review': 75,
  done: 100,
  blocked: 20,
  canceled: 0,
};

/*
 * Qual tela esta aberta. Fica na URL (`?view=`), como o filtro: recarregar a
 * pagina ou abrir um link leva a mesma tela, e nao de volta ao Board. Sem o
 * parametro, ou com um valor que nao e tela, abre o Board.
 *
 * A barra que mostra estas escolhas e o `TaskinWorkspace` do design-vue
 * (task-132); aqui ficam a URL e o recorte pelo dominio. Os valores aceitos
 * na URL sao os mesmos que a barra oferece.
 */
/** O valor do parametro, se for um dos aceitos; senao `undefined`, e quem chama cai no padrao. */
function daUrl<T extends string>(chave: string, aceitos: readonly { value: T }[]): T | undefined {
  const pedido = new URLSearchParams(window.location.search).get(chave);
  return aceitos.find((a) => a.value === pedido)?.value;
}

const mode = ref<WorkspaceView>(daUrl('view', WORKSPACE_VIEWS) ?? 'board');

/**
 * Grava um parametro na URL sem tocar nos outros, e sem criar entrada no
 * historico. Valor vazio tira o parametro: uma busca apagada nao fica como `?q=`.
 */
function gravarNaUrl(chave: 'view' | 'filter' | 'q' | 'sort' | 'score', valor: string) {
  const url = new URL(window.location.href);
  if (valor) url.searchParams.set(chave, valor);
  else url.searchParams.delete(chave);
  window.history.replaceState({}, '', url);
}

function escolherTela(valor: WorkspaceView) {
  mode.value = valor;
  gravarNaUrl('view', valor);
}

/*
 * Qual recorte a tela mostra. Sem `?filter=` na URL, nenhum criterio — e o
 * padrao (as abertas) vem do dominio, por `effectiveFilterCriteria`, e nao se
 * escreve aqui. O botao aceso tambem sai de la.
 *
 * O controle existe porque parametro de URL ninguem descobre. Trocar reescreve
 * a URL, para que recarregar e compartilhar o link mostrem o mesmo recorte.
 *
 * Os contadores (o "Showing N of M" e os do quadro) contam o que esta na
 * tela, e nao o projeto inteiro: o M e o total.
 */
const filtro = ref<WorkspaceFilter | undefined>(daUrl('filter', WORKSPACE_FILTERS));

/*
 * Busca, pontuacao e ordem (task-129). Viviam dentro do quadro de
 * priorizacao, com regra propria: a busca casava id, tipo e titulo, e a da CLI
 * casava id, titulo, status e responsavel. Agora sao o `text`, o
 * `scored`/`unscored` do `filterTasks` e o `ordenarTarefas` do dominio — a
 * mesma resposta que o `taskin list [filter] --scored --sort` da.
 *
 * Ficam na URL, como a tela e o filtro: `?q=`, `?score=` e `?sort=`. A ordem
 * morava no `localStorage` do quadro; la ela nao e mais lida, e sem `?sort=`
 * a ordem e a manual — recarregar mostra o que o link diz, e nao o que o
 * navegador lembrava.
 */
const busca = ref(new URLSearchParams(window.location.search).get('q') ?? '');
const pontuacao = ref<WorkspaceScore>(daUrl('score', WORKSPACE_SCORES) ?? 'all');
const ordem = ref<WorkspaceSort>(daUrl('sort', WORKSPACE_SORTS) ?? 'manual');

const criterios = computed<TaskFilterCriteria>(() => {
  const texto = busca.value.trim();
  return {
    ...(filtro.value && { [filtro.value]: true }),
    ...(texto && { text: texto }),
    ...(pontuacao.value !== 'all' && { [pontuacao.value]: true }),
  };
});
const filtroEfetivo = computed(() => {
  const efetivos = effectiveFilterCriteria(criterios.value);
  return WORKSPACE_FILTERS.find((f) => efetivos[f.value])?.value;
});

function escolherFiltro(valor: WorkspaceFilter) {
  filtro.value = valor;
  gravarNaUrl('filter', valor);
}

function escolherBusca(valor: string) {
  busca.value = valor;
  gravarNaUrl('q', valor.trim());
}

function escolherOrdem(valor: WorkspaceSort) {
  ordem.value = valor;
  gravarNaUrl('sort', valor);
}

function escolherPontuacao(valor: WorkspaceScore) {
  pontuacao.value = valor;
  gravarNaUrl('score', valor);
}

// WebSocket configuration
const wsUrl = ref(
  (window as Window & { VITE_WS_URL?: string }).VITE_WS_URL || import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
);
const reconnectDelay = ref(5000);

// Initialize Pinia task store
const taskStore = usePiniaTaskProvider();

// Connection status
const connectionStatus = computed(() => taskStore.connectionStatus);
const isConnected = computed(() => connectionStatus.value.connected);
const connectionError = computed(() => connectionStatus.value.error);

// Map the store's provider-agnostic tasks onto the dashboard's Task view model.
// The shape comes from the store, so there is no structural type to restate here.
/*
 * Os nomes dos grupos, buscados do proprio servidor.
 *
 * A tarefa carrega so o `groupId` desde a task-079 — o nome vive num registro.
 * Uma busca, e o mapa serve todas as tarefas; antes o nome vinha repetido em
 * cada uma, e sumia quando o caminho de escrita o apagava.
 */
const gruposPorId = ref<Record<string, string>>({});

/*
 * Os grupos com o pai de cada um, para o quadro montar a arvore aninhada
 * (task-119). A tarefa guarda so o grupo mais interno; quem esta dentro de
 * quem vem daqui, e sem isso um subgrupo se desfazia a cada volta da lista.
 */
const gruposDoQuadro = ref<GrupoDoQuadro[]>([]);

/*
 * Quantas tarefas ainda nao tem prioridade.
 *
 * Num projeto meio numerado, o primeiro arrastar reescreve todos os
 * antecessores — 124 arquivos num projeto de 500, medido. O aviso existe para a
 * pessoa saber disso **antes** de descobrir pelo `git status`.
 */
const semPrioridade = ref(0);
const numerando = ref(false);

async function consultarPrioridade() {
  try {
    const r = await fetch('/api/prioritize');
    const previa = (await r.json()) as { withoutPriority?: number } | undefined;
    semPrioridade.value = previa?.withoutPriority ?? 0;
  } catch {
    semPrioridade.value = 0;
  }
}

async function numerarTudo() {
  numerando.value = true;
  try {
    await fetch('/api/prioritize', { method: 'POST' });
    await consultarPrioridade();
  } finally {
    numerando.value = false;
  }
}

onMounted(async () => {
  void consultarPrioridade();

  try {
    const resposta = await fetch('/api/groups');
    const { groups } = (await resposta.json()) as { groups: { id: string; name: string; parentId?: string }[] };
    gruposPorId.value = Object.fromEntries(groups.map((g) => [g.id, g.name]));
    gruposDoQuadro.value = groups.map((g) => ({ id: g.id, name: g.name, ...(g.parentId && { parentId: g.parentId }) }));
  } catch {
    // Sem grupos: a tela mostra as tarefas sem o rotulo, e nada quebra.
  }
});

const tasks = computed<Task[]>(() => {
  /*
   * A regra de filtro vem do dominio, e nao daqui.
   *
   * Ate a task-064 esta tela reimplementava `open` e `closed` a mao, e por isso
   * nao conhecia `active` — a mesma duplicacao que a task-071 matou entre a CLI
   * e o servidor MCP, sobrevivendo na terceira superficie.
   *
   * O que destravou foi `disableSourceOfProjectReferenceRedirect` no tsconfig:
   * sem ele o compilador seguia o `.d.ts` do pacote ate o `src`, e o `rootDir`
   * recusava.
   */
  const filtered = ordenarTarefas(filterTasks(taskStore.tasks, criterios.value), ordem.value);

  const mapped = filtered.map((source) => {
    const progressPercentage = PROGRESS_BY_STATUS[source.status];

    const task: Task = {
      id: source.id,
      number: parseInt(source.id, 10) || 0,
      title: source.title,
      description: source.description ?? '',
      status: source.status,
      assignee: source.assignee
        ? {
            id: source.assignee.id,
            name: source.assignee.name,
            email: source.assignee.email,
            // O dominio guarda a identidade (o hash), nao a URL. O dashboard
            // pede a imagem ao proprio servidor por caminho relativo, para nao
            // vazar IP/referrer a terceiro e para funcionar sob CSP 'self'.
            // Ver task-067.
            avatar: source.assignee.avatarHash ? `/avatar/${source.assignee.avatarHash}` : undefined,
          }
        : undefined,
      dates: {
        created: source.createdAt || new Date().toISOString(),
      },
      tags: source.type ? [source.type] : [],
      progress: {
        percentage: progressPercentage,
      },
      type: source.type,
      order: source.order,
      parent: source.groupId ? { type: 'group', id: groupId(source.groupId) } : undefined,
      groupName: source.groupId ? gruposPorId.value[source.groupId] : undefined,
      difficulty: source.difficulty,
    };

    return task;
  });

  return mapped;
});

const isLoading = computed(() => taskStore.loading);

// Connect on mount
onMounted(() => {
  taskStore.connect({
    wsUrl: wsUrl.value,
    autoReconnect: true,
    reconnectDelay: reconnectDelay.value,
  });
});

// Disconnect on unmount
onUnmounted(() => {
  taskStore.disconnect();
});

// Refresh handler
const handleRefresh = () => {
  taskStore.getAllTasks();
};

/*
 * Grava o que o quadro de priorizacao mudou numa tarefa, pelas operacoes
 * nomeadas — as mesmas do `ITaskManager` que a CLI e o MCP chamam — e nao mais
 * mandando a tarefa inteira num `update` generico (task-106).
 */
const handleUpdateTask = (task: Task) => {
  const original = taskStore.tasks.find((t) => t.id === task.id);
  if (!original) return;

  const operacoes = operacoesDaMudanca(
    original,
    {
      order: task.order,
      groupId: task.parent?.type === 'group' ? task.parent.id : undefined,
      difficulty: task.difficulty,
    },
    gruposPorId.value,
  );

  for (const operacao of operacoes) {
    // O segundo membro de um grupo recem-criado nao pode cria-lo de novo.
    if (operacao.type === 'create-group') {
      gruposPorId.value = { ...gruposPorId.value, [operacao.payload.id]: operacao.payload.name };
    }
    taskStore.operar(operacao);
  }
};

/*
 * Criar um subgrupo e aninhar um grupo em outro vao ao dominio como
 * `create-group` (com o pai), `nest-group` e `unnest-group` (task-119). O App
 * guarda o pai na hora, antes da resposta: a lista de tarefas que volta
 * reconstroi a arvore, e precisa encontrar o grupo no lugar novo. O quadro
 * emite os grupos antes das tarefas, entao um grupo novo ja e conhecido quando
 * os membros entram nele, e nao e criado de novo.
 */
const handleUpdateGroup = (mudanca: MudancaDeGrupo) => {
  const operacao = operacaoDoGrupo(mudanca);
  const nome =
    operacao.type === 'create-group' ? operacao.payload.name : (gruposPorId.value[mudanca.id] ?? NOME_DE_GRUPO_NOVO);
  const gravado: GrupoDoQuadro = {
    id: mudanca.id,
    name: nome,
    ...(mudanca.parentId && { parentId: mudanca.parentId }),
  };

  gruposPorId.value = { ...gruposPorId.value, [mudanca.id]: nome };
  gruposDoQuadro.value = [...gruposDoQuadro.value.filter((g) => g.id !== mudanca.id), gravado];
  taskStore.operar(operacao);
};

/*
 * Mover — setas, topo, fim, arrastar — vai ao dominio como `move-before`,
 * `move-group-after`, ... com a linha visivel de referencia (task-118). O
 * servidor responde com a lista inteira, e a nova ordem chega por ela.
 */
const handleMove = (movimento: MovimentoDoQuadro) => {
  taskStore.operar(operacaoDoMovimento(movimento));
};

// Connection status type for header component
const connectionStatusType = computed<'connected' | 'disconnected' | 'connecting' | 'error'>(() => {
  if (isConnected.value) return 'connected';
  if (connectionError.value) return 'error';
  return 'connecting';
});

// Connection status text
const statusText = computed(() => {
  if (isConnected.value) return 'Connected';
  if (connectionError.value) return 'Connection error';
  return 'Connecting...';
});
</script>

<style>
/* Global styles - apply design-vue variables to body */
body {
  margin: 0;
  padding: 0;
  background: var(--bg-body);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.aviso-prioridade {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 8px;
  border-left: 3px solid #b7791f;
  background: #fffaf0;
  color: #744210;
  font-size: 14px;
  line-height: 1.5;
}

.aviso-prioridade button {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid #b7791f;
  border-radius: 4px;
  background: transparent;
  color: #744210;
  font: inherit;
  cursor: pointer;
}

.aviso-prioridade button:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (prefers-color-scheme: dark) {
  .aviso-prioridade {
    background: #2a2015;
    color: #f0d9a8;
    border-left-color: #d69e2e;
  }

  .aviso-prioridade button {
    border-color: #d69e2e;
    color: #f0d9a8;
  }
}
</style>
