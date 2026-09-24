# @opentask/taskin-task-provider-pinia

Pinia-based task provider with WebSocket synchronization for real-time task management in Vue applications.

## Features

- ✅ Implements `ITaskProvider` interface
- ✅ Reactive state management with Pinia
- ✅ Real-time synchronization via WebSocket
- ✅ Offline-first with local cache
- ✅ Automatic reconnection
- ✅ TypeScript support

## Installation

```bash
pnpm add @opentask/taskin-task-provider-pinia
```

## Usage

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { usePiniaTaskProvider } from '@opentask/taskin-task-provider-pinia';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Connect to WebSocket server
const taskStore = usePiniaTaskProvider();
taskStore.connect('ws://localhost:3001');

// Use as ITaskProvider
const tasks = await taskStore.getAllTasks();

// Change a task through a named operation — reflected in the cache right away
taskStore.operar({ type: 'set-priority', payload: { taskId: '042', priority: 30 } });
taskStore.operar({ type: 'assign-to-group', payload: { taskId: '042', groupId: 'g-sprint' } });
```

`updateTask` always rejects: the server only takes named operations
(`set-priority`, `set-difficulty`, `assign-to-group`, `remove-from-group`,
`move-before`, `move-after`, `create-group`). See the protocol in
`@opentask/taskin-task-server-ws`.

## API

See [src/index.ts](./src/index.ts) for full API documentation.

## License

MIT © [OpenTask](https://opentask.com.br)
