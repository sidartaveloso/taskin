# @opentask/taskin-task-server-mcp

Model Context Protocol (MCP) server for task management integration with LLMs like Claude, GPT-4, and GitHub Copilot.

## Features

- ✅ Full MCP protocol implementation
- ✅ Exposes task operations as MCP tools
- ✅ Task context via MCP resources
- ✅ Task templates via MCP prompts
- ✅ Real-time task updates
- ✅ TypeScript support
- ✅ Auto-discovery in VS Code and Claude Desktop

## Quick Start

### VS Code (GitHub Copilot)

The server will appear automatically in VS Code's MCP server list after installation:

```bash
npm install -g @opentask/taskin-task-server-mcp
```

Then in VS Code:

1. Open Command Palette (`Cmd+Shift+P`)
2. Search for "Configure Tools"
3. Find "taskin" in the MCP servers list
4. Enable it

Or add manually to your `settings.json`:

```json
{
  "github.copilot.chat.mcpServers": {
    "taskin": {
      "command": "taskin-mcp-server"
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskin": {
      "args": ["-y", "@opentask/taskin-task-server-mcp"],
      "command": "npx"
    }
  }
}
```

## Installation

### Global (Recommended)

```bash
npm install -g @opentask/taskin-task-server-mcp
```

### Project-specific

```bash
pnpm add @opentask/taskin-task-server-mcp
```

## Programmatic Usage

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
