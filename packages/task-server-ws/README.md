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

See [src/task-server-ws.types.ts](./src/task-server-ws.types.ts) for message protocol documentation.

## License

MIT © [OpenTask](https://opentask.com.br)
