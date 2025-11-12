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
```

## API

See [src/index.ts](./src/index.ts) for full API documentation.

## License

MIT © [OpenTask](https://opentask.com.br)
