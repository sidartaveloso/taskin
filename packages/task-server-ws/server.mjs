#!/usr/bin/env tsx
import { FileSystemTaskProvider, UserRegistry } from '@opentask/taskin-file-system-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import { join } from 'path';
import { TaskWebSocketServer } from './dist/task-server-ws.js';

const TASKS_DIR = join(process.cwd(), '../../TASKS');
const TASKIN_DIR = join(process.cwd(), '../../.taskin');

// biome-ignore lint/suspicious/noConsole: server entry point
console.log('🚀 Starting Task WebSocket Server...');
// biome-ignore lint/suspicious/noConsole: server entry point
console.log('📁 Tasks directory:', TASKS_DIR);
// biome-ignore lint/suspicious/noConsole: server entry point
console.log('⚙️  Taskin directory:', TASKIN_DIR);

// Initialize user registry
const userRegistry = new UserRegistry({
  taskinDir: TASKIN_DIR,
});
await userRegistry.load();

// Initialize task provider
const taskProvider = new FileSystemTaskProvider(TASKS_DIR, userRegistry);

// Initialize task manager
const taskManager = new TaskManager(taskProvider);

// Create and start server
const server = new TaskWebSocketServer({
  taskManager,
  taskProvider,
  options: {
    port: 3001,
    host: 'localhost',
    debug: true,
  },
});

// Start server
server
  .start()
  .then(() => {
    // biome-ignore lint/suspicious/noConsole: server entry point
    console.log('✅ Server is running on ws://localhost:3001');
    // biome-ignore lint/suspicious/noConsole: server entry point
    console.log('📊 Dashboard should be available at http://localhost:5173');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Handle shutdown
process.on('SIGINT', async () => {
  // biome-ignore lint/suspicious/noConsole: server entry point
  console.log('\n⏹️  Shutting down server...');
  await server.stop();
  // biome-ignore lint/suspicious/noConsole: server entry point
  console.log('✅ Server stopped');
  process.exit(0);
});
