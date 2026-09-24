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

- Add an example adapter implementation in `file-system-task-provider`.
- Add documentation to the repo-level `docs/` folder and cross-links.

Tell me which and I’ll implement it.

# @taskin/task-manager

This package is responsible for the core logic of managing tasks.

## Named operations, and where each one is exposed

Grouping, prioritizing and scoring are named operations of `ITaskManager` —
`assignToGroup`, `removeFromGroup`, `setPriority`, `moveBefore`, `moveAfter`,
`moveToTop`, `moveToBottom`, `moveGroupBefore`, `moveGroupAfter`, `moveGroupToTop`,
`moveGroupToBottom`, `createGroup`, `nestGroup`, `unnestGroup`, `setDifficulty` — and not a side effect of a generic `updateTask`. The CLI, the
MCP server and the dashboard (through the WebSocket server) all call them.

`SUPERFICIES_DAS_OPERACOES` says, for every operation, how each surface exposes
it: by name (`{ nome: 'set_priority' }`) or absent with the reason written
(`{ ausente: '...' }`). It `satisfies Record<OperacaoDoManager, ...>`, so
adding an operation to `ITaskManager` without deciding the three surfaces does
not compile. `NomeNaSuperficie<'ws'>` types the WebSocket handlers from the
same table, and `nomesNaSuperficie('cli' | 'mcp')` lets the CLI and the MCP
server check at test time that every declared name exists.

Anyone implementing `ITaskManager` can prove the named operations against
themselves with the contract suite:

```ts
import { runTaskManagerContractTests } from '@opentask/taskin-task-manager/testing';

runTaskManagerContractTests(async (tasks, groups) => ({ manager, ler: (id) => ... }));
```

## Groups inside groups

A group may sit inside another: `Group.parentId` is optional, and a task still
carries one group, the innermost. `createGroup(name, { id?, parentId? })`,
`nestGroup(groupId, parentId)` and `unnestGroup(groupId)` write only the group,
never a task. `validarAninhamento` refuses a missing parent, a group inside
itself, a cycle, and more than `PROFUNDIDADE_MAXIMA_DE_GRUPO` (4) levels —
counting the subtree that goes along. Rules about "the whole group" (moving it,
the top and bottom of a grouped task) use the subtree; `assignToGroup` puts the
task in that very group.

Nesting is a capability of its own: `IGroupRegistry.setParent?` is optional.
Without it, the three operations refuse with `NESTING_NOT_SUPPORTED`. A registry
that implements it proves `runGroupNestingContractTests`, separate from
`runGroupRegistryContractTests`. Deleting a group moves its subgroups up to its
parent, or to the root. See `docs/RDT/grupos-aninhados.md`.

See `docs/RDT/superficies-derivam-do-mesmo-contrato.md`.
