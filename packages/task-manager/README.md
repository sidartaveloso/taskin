# Task Manager — Metrics Interface

This document describes the new `IMetricsManager` interface introduced to
separate metrics/analytics responsibilities from the core `ITaskProvider`.

## Motivation

Previously the `ITaskProvider` exposed optional methods for statistics
(`getUserStats`, `getTeamStats`, `getTaskStats`). To keep provider
implementations focused on storage concerns and to provide a clearer
contract for analytics, we introduced `IMetricsManager` as a dedicated
interface for metrics/analytics.

## Interface

The interface lives at `packages/task-manager/src/metrics.types.ts`:

- `getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats>`
- `getTeamMetrics(teamId: string, query?: StatsQuery): Promise<TeamStats>`
- `getTaskMetrics(taskId: string, query?: StatsQuery): Promise<TaskStats>`

Types are re-used from `@opentask/taskin-types` (`UserStats`, `TeamStats`,
`TaskStats`, `StatsQuery`).

## Migration guide

1. Remove any optional stats methods from provider implementations. The
   methods were removed from `ITaskProvider` to avoid mixing concerns.
2. Implement an adapter/service that implements `IMetricsManager` and
   register it alongside your provider (for example, provide it to the
   application bootstrap or dependency injection container).
3. If you need to preserve backward compatibility, expose a thin adapter
   that translates the old provider-level methods to the new
   `IMetricsManager` API until consumers migrate.

## Example

Minimal example of an in-process metrics adapter (pseudo-code):

```ts
import type { IMetricsManager } from '@opentask/taskin-task-manager';
import type { UserStats, StatsQuery } from '@opentask/taskin-types';

export class FsMetricsAdapter implements IMetricsManager {
  constructor(private fsProvider: any) {}

  async getUserMetrics(userId: string, query?: StatsQuery): Promise<UserStats> {
    // Aggregate tasks from fsProvider and compute simple metrics
    const tasks = await this.fsProvider.getAllTasks();
    const userTasks = tasks.filter((t) => t.assignee?.id === userId);
    return { userId, taskCount: userTasks.length } as any;
  }

  // getTeamMetrics / getTaskMetrics implementations...
}
```

## Compatibility and Versioning

- This change is a breaking API change for providers: `ITaskProvider`
  no longer contains stats methods. New providers should implement
  `IMetricsManager` instead.
- For consumers, prefer depending on `IMetricsManager` for analytics
  features. If a provider exposes metrics through a different channel,
  adapt it to `IMetricsManager`.

## Tests

There is a small unit test validating the contract at
`packages/task-manager/src/provider-stats.test.ts` (now checks the
`IMetricsManager` shape).

---

If you want, I can:

- Add an example adapter implementation in `fs-task-provider`.
- Add documentation to the repo-level `docs/` folder and cross-links.

Tell me which and I’ll implement it.

# @taskin/task-manager

This package is responsible for the core logic of managing tasks.
