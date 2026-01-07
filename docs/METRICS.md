# Métricas e Analytics (Taskin)

Este documento descreve a nova arquitetura de métricas do Taskin e como
implementar/adotar `IMetricsManager` no ecossistema.

## Objetivo

Separar a lógica de persistência/fornecimento de tarefas (providers) da
lógica de agregação e relatórios (metrics/analytics). Isso mantém provedores
simples e permite construir pipelines de métricas independentes.

## Interface

`IMetricsManager` (local: `packages/task-manager/src/metrics.types.ts`)

- `getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats>`
- `getTeamMetrics(teamId: string, query?: StatsQuery): Promise<TeamStats>`
- `getTaskMetrics(taskId: string, query?: StatsQuery): Promise<TaskStats>`

Os tipos são definidos em `@opentask/taskin-types`.

## Boas práticas

- Mantenha o `IMetricsManager` leve: agregue sob demanda, evite cálculos
  pesados no hot path.
- Cache de curto-prazo para evitar recomputação em queries frequentes.
- Use `StatsQuery` para filtrar período (`day|week|month`) e formato de
  saída (json/csv).
- Documente limitações de precisão (por exemplo, commits não rastreados
  não aparecerão nas métricas de código).

## Exemplos

### Adapter mínimo (pseudo-code)

```ts
import type { IMetricsManager } from '@opentask/taskin-task-manager';
import type { UserStats } from '@opentask/taskin-types';

export class FsMetricsAdapter implements IMetricsManager {
  constructor(private fsProvider: any) {}

  async getUserMetrics(userId: string): Promise<UserStats> {
    const tasks = await this.fsProvider.getAllTasks();
    const userTasks = tasks.filter((t: any) => t.assignee?.id === userId);
    return {
      userId,
      taskCount: userTasks.length,
      // campos adicionais conforme schema
    } as any;
  }

  // getTeamMetrics / getTaskMetrics...
}
```

### Integração

- Em aplicações server-side, registre o adapter no bootstrap e injete
  onde necessário.
- Em frontends, crie uma camada `metricsClient` que chame um endpoint
  que delegue para `IMetricsManager`.

## Migração

- Removemos os métodos de stats do `ITaskProvider`. Se você mantinha uma
  implementação antiga, crie um adapter que implemente `IMetricsManager`
  e exponha os mesmos dados.

## Testes

- Adicione testes unitários para validar a forma dos retornos dos
  métodos (`UserStats`, `TeamStats`, `TaskStats`).

## Roadmap

- Adicionar `generateReport(format: 'csv'|'json')` no `IMetricsManager`
  se houver necessidade de exportação.
- Integração com Git para métricas de código (commits, linhas alteradas).
- Exportadores para Prometheus/Grafana para monitoramento em produção.
