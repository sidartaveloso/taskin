<script setup lang="ts">
/**
 * A tela inteira do dashboard: a barra do topo (telas, filtro de status,
 * busca, ordem, pontuacao, contagem e conexao) e a troca entre o Board e a
 * priorizacao (task-132).
 *
 * Nao le a URL, nem o store, e nao filtra. Recebe as tarefas ja recortadas e as
 * escolhas atuais, e emite cada escolha; quem hospeda guarda e aplica o
 * recorte pelo dominio (task-129). Os eventos da priorizacao passam direto.
 */
import { computed } from 'vue';
import type { GrupoDoQuadro, MovimentoDoQuadro, MudancaDeGrupo } from '../../composables/use-prioritization';
import type { Task } from '../../types';
import ConnectionStatus from '../molecules/ConnectionStatus.vue';
import Dashboard from '../templates/Dashboard.vue';
import PrioritizationPage from './PrioritizationPage.vue';
import {
  WORKSPACE_FILTERS,
  WORKSPACE_SCORES,
  WORKSPACE_SORTS,
  WORKSPACE_VIEWS,
  type WorkspaceConnection,
  type WorkspaceFilter,
  type WorkspaceScore,
  type WorkspaceSort,
  type WorkspaceView,
} from './TaskinWorkspace.types';

export interface TaskinWorkspaceProps {
  /** As tarefas ja recortadas e ordenadas por quem hospeda. */
  tasks: Task[];
  /** Quantas tarefas o projeto tem, sem recorte: o M do "Showing N of M". */
  total: number;
  /** Os grupos do registro, com o pai de cada um (task-119). */
  groups?: GrupoDoQuadro[];
  view?: WorkspaceView;
  /** O filtro efetivo, para acender o botao; sem ele, nenhum aceso. */
  filter?: WorkspaceFilter;
  search?: string;
  sort?: WorkspaceSort;
  score?: WorkspaceScore;
  title?: string;
  connectionStatus?: WorkspaceConnection;
  statusText?: string;
  /** A mensagem de quando a conexao cai; com ela aparecem o aviso e o retry. */
  connectionError?: string;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<TaskinWorkspaceProps>(), {
  groups: () => [],
  view: 'board',
  search: '',
  sort: 'manual',
  score: 'all',
  title: 'Taskin Dashboard',
  connectionStatus: 'connecting',
  statusText: 'Connecting...',
  connectionError: '',
  isLoading: false,
});

const emit = defineEmits<{
  'update:view': [view: WorkspaceView];
  'update:filter': [filter: WorkspaceFilter];
  'update:search': [search: string];
  'update:sort': [sort: WorkspaceSort];
  'update:score': [score: WorkspaceScore];
  retry: [];
  'update-task': [task: Task];
  'update-group': [mudanca: MudancaDeGrupo];
  move: [movimento: MovimentoDoQuadro];
}>();

/* O titulo do Board diz o recorte; era fixo em "Tarefas em Andamento", mesmo em Closed. */
const gridTitle = computed(() => {
  const rotulo = WORKSPACE_FILTERS.find((f) => f.value === props.filter)?.label ?? 'All';
  return `${rotulo} tasks`;
});
</script>

<template>
  <div class="taskin-workspace">
    <div class="top-bar" data-testid="top-bar">
      <div class="mode-toggle" role="group" aria-label="Which screen to show">
        <button
          v-for="opcao in WORKSPACE_VIEWS"
          :key="opcao.value"
          type="button"
          :data-view="opcao.value"
          :class="{ active: view === opcao.value }"
          :aria-pressed="view === opcao.value"
          @click="emit('update:view', opcao.value)"
        >
          {{ opcao.label }}
        </button>
      </div>

      <div class="filter-toggle" role="group" aria-label="Which tasks to show">
        <button
          v-for="opcao in WORKSPACE_FILTERS"
          :key="opcao.value"
          type="button"
          :data-filter="opcao.value"
          :class="{ active: filter === opcao.value }"
          :aria-pressed="filter === opcao.value"
          @click="emit('update:filter', opcao.value)"
        >
          {{ opcao.label }}
        </button>
      </div>

      <!--
        Busca, ordem e pontuacao dizem quais tarefas e em que ordem, e nao como
        desenhar: valem para as duas telas, e por isso moram aqui (task-129).
      -->
      <div class="query-controls" role="group" aria-label="Search, order and score">
        <input
          type="search"
          class="query-controls__search"
          data-testid="search-input"
          placeholder="Search id, title, type, status, assignee"
          aria-label="Search tasks"
          :value="search"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
        <select
          data-testid="sort-select"
          aria-label="Order"
          :value="sort"
          @change="emit('update:sort', ($event.target as HTMLSelectElement).value as WorkspaceSort)"
        >
          <option v-for="opcao in WORKSPACE_SORTS" :key="opcao.value" :value="opcao.value">{{ opcao.label }}</option>
        </select>
        <select
          data-testid="score-select"
          aria-label="Difficulty score"
          :value="score"
          @change="emit('update:score', ($event.target as HTMLSelectElement).value as WorkspaceScore)"
        >
          <option v-for="opcao in WORKSPACE_SCORES" :key="opcao.value" :value="opcao.value">{{ opcao.label }}</option>
        </select>
      </div>

      <span class="filter-toggle__count" data-testid="filter-count">
        Showing {{ tasks.length }} of {{ total }} tasks
      </span>

      <!--
        A conexao e uma so, a do WebSocket, e as duas telas dependem dela: a de
        priorizacao grava pelo servidor a cada movimento. Por isso fica aqui, e
        nao no cabecalho do Board (task-128).
      -->
      <ConnectionStatus
        :status="connectionStatus"
        :status-text="statusText"
        :show-retry="!!connectionError"
        :is-retrying="isLoading"
        @retry="emit('retry')"
      />
    </div>

    <div v-if="connectionError" class="connection-error" role="alert" data-testid="connection-error">
      ⚠️ {{ connectionError }}
    </div>

    <Dashboard
      v-if="view === 'board'"
      :title="title"
      :show-connection="false"
      :is-loading="isLoading"
      :tasks="tasks"
      :grid-title="gridTitle"
      @retry="emit('retry')"
    />
    <PrioritizationPage
      v-else
      :tasks="tasks"
      :groups="groups"
      :sort-mode="sort"
      @update-task="emit('update-task', $event)"
      @update-group="emit('update-group', $event)"
      @move="emit('move', $event)"
    />
  </div>
</template>

<style scoped>
/*
 * Uma barra so para as telas, o filtro e a contagem: eram duas, e cada uma
 * gastava uma linha inteira de altura. Em tela estreita, os grupos quebram
 * para a linha de baixo em vez de espremer os botoes.
 */
.top-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.4rem 1rem;
  background: var(--bg-card, #fff);
  border-bottom: 1px solid var(--border-muted, #e5e5e5);
}

.mode-toggle,
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mode-toggle button,
.filter-toggle button {
  background: transparent;
  border: 1px solid var(--border-muted, #e5e5e5);
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--text-primary, #212529);
}

.mode-toggle button {
  font-weight: 600;
}

.mode-toggle button.active {
  background: var(--status-progress-bg, #169bd7);
  color: #fff;
  border-color: transparent;
}

.filter-toggle button.active {
  background: var(--text-primary, #212529);
  color: var(--bg-card, #fff);
  border-color: transparent;
}

/* Separa os grupos da barra, que sao escolhas de natureza diferente. */
.filter-toggle,
.query-controls {
  padding-left: 1rem;
  border-left: 1px solid var(--border-muted, #e5e5e5);
}

/*
 * A busca cresce e encolhe com o espaco que sobra, para a barra caber numa
 * linha no desktop. A base e pequena de proposito: o `flex-wrap` decide quebrar
 * pela base, antes de encolher, e com a base na largura do conteudo a barra
 * quebrava ja em 1280px. Abaixo de 640px os controles quebram entre si, em vez
 * de alargar a pagina.
 */
.query-controls {
  display: flex;
  flex: 1 1 28rem;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
}

.query-controls input,
.query-controls select {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-muted, #e5e5e5);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary, #212529);
}

.query-controls__search {
  flex: 1 1 8rem;
  min-width: 7rem;
  max-width: 20rem;
}

.query-controls select {
  max-width: 100%;
}

@media (max-width: 640px) {
  .query-controls {
    flex-basis: 100%;
    flex-wrap: wrap;
    padding-left: 0;
    border-left: none;
  }
}

.filter-toggle__count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--text-secondary, #6c757d);
}

.connection-error {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--status-warning-bg, #feb2b2);
  background: var(--bg-section-error, #fff5f5);
  color: var(--text-error-dark, #c92a2a);
  font-size: 0.875rem;
}
</style>
