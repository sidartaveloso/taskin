# @opentask/taskin-task-server-mcp

Model Context Protocol (MCP) server for task management integration with LLMs like Claude, GPT-4, and others.

## Features

- ✅ Full MCP protocol implementation
- ✅ Exposes task operations as MCP tools
- ✅ Task context via MCP resources
- ✅ Task templates via MCP prompts
- ✅ Real-time task updates
- ✅ TypeScript support

## Installation

```bash
pnpm add @opentask/taskin-task-server-mcp
```

## Usage

```typescript
import { createTaskManager } from '@opentask/taskin-task-manager';
import { createTaskMCPServer } from '@opentask/taskin-task-server-mcp';

// Create task manager with your provider
const taskManager = createTaskManager({
  provider: 'fs',
  config: { tasksDirectory: './TASKS' },
});

// Start MCP server
const server = createTaskMCPServer(taskManager, {
  name: 'taskin-server',
  version: '1.0.0',
});

await server.connect({
  transport: 'stdio', // or 'sse'
});

console.log('MCP server running');
```

## MCP Tools

- `list_tasks` - List all tasks with filters
- `get_task` - Get task details
- `start_task` - Start working on a task
- `finish_task` - Mark task as complete
- `pause_task` - Pause task work
- `lint_tasks` - Validate tasks

## MCP Resources

- `task://{taskId}` - Get full task context
- `tasks://status/{status}` - Get tasks by status

## MCP Prompts

- `start-task` - Template for starting a task
- `review-task` - Template for reviewing a task

## License

MIT © [OpenTask](https://opentask.com.br)
