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

  <div class="mode-toggle">
    <button
      type="button"
      :class="{ active: mode === 'board' }"
      @click="mode = 'board'"
    >
      Board
    </button>
    <button
      type="button"
      :class="{ active: mode === 'prioritization' }"
      @click="mode = 'prioritization'"
    >
      Prioritization
    </button>
  </div>

  <div class="filter-toggle" role="group" aria-label="Which tasks to show">
    <button
      v-for="opcao in FILTROS"
      :key="opcao.valor"
      type="button"
      :data-filter="opcao.valor"
      :class="{ active: filtroEfetivo === opcao.valor }"
      :aria-pressed="filtroEfetivo === opcao.valor"
      @click="escolherFiltro(opcao.valor)"
    >
      {{ opcao.rotulo }}
    </button>
    <span class="filter-toggle__count" data-testid="filter-count">
      Showing {{ tasks.length }} of {{ taskStore.tasks.length }} tasks
    </span>
  </div>

  <Dashboard
    v-if="mode === 'board'"
    title="Taskin Dashboard"
    :connection-status="connectionStatusType"
    :status-text="statusText"
    :error-message="connectionError || ''"
    :show-retry="!!connectionError"
    :is-retrying="isLoading"
    :is-loading="isLoading"
    :tasks="tasks"
    @retry="handleRefresh"
  />
  <PrioritizationPage
    v-else
    :tasks="tasks"
    :groups="gruposDoQuadro"
    @update-task="handleUpdateTask"
    @update-group="handleUpdateGroup"
    @move="handleMove"
  />
</template>

<script setup lang="ts">
import type { GrupoDoQuadro, MovimentoDoQuadro, MudancaDeGrupo, Task, TaskStatus } from '@opentask/taskin-design-vue';
import { Dashboard, groupId, PrioritizationPage } from '@opentask/taskin-design-vue';
import { effectiveFilterCriteria, filterTasks, type TaskFilterCriteria } from '@opentask/taskin-task-manager';
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

const mode = ref<'board' | 'prioritization'>('board');

/*
 * Qual recorte a tela mostra. Sem `?filter=` na URL, nenhum criterio — e o
 * padrao (as abertas) vem do dominio, por `effectiveFilterCriteria`, e nao se
 * escreve aqui. O botao aceso tambem sai de la.
 *
 * O controle existe porque parametro de URL ninguem descobre. Trocar reescreve
 * a URL, para que recarregar e compartilhar o link mostrem o mesmo recorte.
 *
 * Os contadores (este "Showing N of M" e os do quadro) contam o que esta na
 * tela, e nao o projeto inteiro: o M e o total.
 */
type Filtro = 'open' | 'active' | 'closed' | 'all';

const FILTROS: readonly { valor: Filtro; rotulo: string }[] = [
  { valor: 'open', rotulo: 'Open' },
  { valor: 'active', rotulo: 'Active' },
  { valor: 'closed', rotulo: 'Closed' },
  { valor: 'all', rotulo: 'All' },
];

function filtroDaUrl(): Filtro | undefined {
  const pedido = new URLSearchParams(window.location.search).get('filter');
  return FILTROS.find((f) => f.valor === pedido)?.valor;
}

const filtro = ref<Filtro | undefined>(filtroDaUrl());
const criterios = computed<TaskFilterCriteria>(() => (filtro.value ? { [filtro.value]: true } : {}));
const filtroEfetivo = computed(() => {
  const efetivos = effectiveFilterCriteria(criterios.value);
  return FILTROS.find((f) => efetivos[f.valor])?.valor;
});

function escolherFiltro(valor: Filtro) {
  filtro.value = valor;
  const url = new URL(window.location.href);
  url.searchParams.set('filter', valor);
  window.history.replaceState({}, '', url);
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
  const filtered = filterTasks(taskStore.tasks, criterios.value);

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

    console.log('Mapped task:', task.id, 'assignee:', task.assignee);

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

.mode-toggle {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-card, #fff);
  border-bottom: 1px solid var(--border-muted, #e5e5e5);
}

.mode-toggle button {
  background: transparent;
  border: 1px solid var(--border-muted, #e5e5e5);
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-primary, #212529);
}

.mode-toggle button.active {
  background: var(--status-progress-bg, #169bd7);
  color: #fff;
  border-color: transparent;
}

.filter-toggle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: var(--bg-card, #fff);
  border-bottom: 1px solid var(--border-muted, #e5e5e5);
}

.filter-toggle button {
  background: transparent;
  border: 1px solid var(--border-muted, #e5e5e5);
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--text-primary, #212529);
}

.filter-toggle button.active {
  background: var(--text-primary, #212529);
  color: var(--bg-card, #fff);
  border-color: transparent;
}

.filter-toggle__count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--text-secondary, #6c757d);
}

/* Page-specific styles */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border, #e5e5e5);
  border-top-color: var(--color-primary, #169bd7);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.empty-state p {
  color: var(--color-text-secondary, #495057);
  margin: 0.5rem 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-text-primary, #212529);
  margin-bottom: 0.5rem;
}
</style>
