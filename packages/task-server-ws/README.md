# @opentask/taskin-task-server-ws

WebSocket server for real-time task management. Exposes `ITaskManager` operations via WebSocket protocol with automatic broadcasting of changes to all connected clients.

## Features

- ✅ Real-time task synchronization
- ✅ Multiple client support
- ✅ Automatic change broadcasting
- ✅ Connection management
- ✅ Error handling
- ✅ TypeScript support

## Installation

```bash
pnpm add @opentask/taskin-task-server-ws
```

## Usage

```typescript
import { createTaskManager } from '@opentask/taskin-task-manager';
import { createTaskWebSocketServer } from '@opentask/taskin-task-server-ws';

// Create task manager with your provider
const taskManager = createTaskManager({
  provider: 'fs',
  config: { tasksDirectory: './TASKS' },
});

// Start WebSocket server
const server = createTaskWebSocketServer(taskManager, {
  port: 3001,
  host: 'localhost',
});

console.log('WebSocket server running on ws://localhost:3001');
```

## Protocol

Every request is `{ type, payload?, requestId? }`. The requests that change a
task are the named operations of `ITaskManager` — the same ones the CLI and the
MCP server call. There is **no generic `update`**: a whole task to overwrite
was how grouping, prioritizing and scoring used to exist only in the dashboard
(task-106).

| request | payload | answer, to every client |
| --- | --- | --- |
| `list` | — | `tasks` |
| `find` | `{ taskId }` | `task:found` (to the sender) |
| `start` / `pause` / `finish` | `{ taskId }` | `task:updated` |
| `assign-to-group` | `{ taskId, groupId }` — the group must exist | `task:updated` |
| `remove-from-group` | `{ taskId }` | `task:updated` |
| `set-priority` | `{ taskId, priority }` — whole number, 1 or more | `task:updated` |
| `set-difficulty` | `{ taskId, difficulty }` — whole number, 1 to 5 | `task:updated` |
| `move-before` / `move-after` | `{ taskId, targetId }` | `tasks` (neighbours may be renumbered) |
| `move-to-top` / `move-to-bottom` | `{ taskId }` — a grouped task stays inside its group | `tasks` (an unnumbered tail is numbered once) |
| `create-group` | `{ id, name }` | `group:created` |
| `ping` | — | `pong` (to the sender) |

Anything refused comes back to the sender as `error` with `{ message }`.
Requests are handled one at a time, in arrival order, so `create-group`
followed by `assign-to-group` always finds the group.

Which operations the WebSocket exposes is not a list kept here: the handlers
are typed by `NomeNaSuperficie<'ws'>` from `SUPERFICIES_DAS_OPERACOES` in
`@opentask/taskin-task-manager`, so declaring an operation there and forgetting
its handler does not compile.

## License

MIT © [OpenTask](https://opentask.com.br)
