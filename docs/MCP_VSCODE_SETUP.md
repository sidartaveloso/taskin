# Using Taskin with MCP in VS Code

VS Code has native support for MCP servers through GitHub Copilot Chat. This allows you to manage tasks directly via chat with Copilot.

## VS Code Configuration

### 1. Configuration via settings.json

Add to your `settings.json` (User or Workspace):

**For global use (User Settings):**

Press `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"

```json
{
  "github.copilot.chat.mcpServers": {
    "taskin": {
      "args": [
        "/Users/sidarta/repositorios/taskin/packages/cli/dist/index.js",
        "mcp-server"
      ],
      "command": "node",
      "cwd": "/Users/sidarta/repositorios/taskin"
    }
  }
}
```

**For project-specific use (Workspace Settings):**

Create `.vscode/settings.json` in your project:

```json
{
  "github.copilot.chat.mcpServers": {
    "taskin": {
      "args": ["${workspaceFolder}/packages/cli/dist/index.js", "mcp-server"],
      "command": "node",
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 2. Configuration for multiple projects

If you want all projects to have access to Taskin:

```json
{
  "github.copilot.chat.mcpServers": {
    "taskin": {
      "args": [
        "/caminho/global/para/taskin/packages/cli/dist/index.js",
        "mcp-server"
      ],
      "command": "node",
      "cwd": "${workspaceFolder}"
    }
  }
}
```

**Note:** Use `${workspaceFolder}` so the MCP server uses the current project directory.

## How to Use

After configuration, you can use GitHub Copilot Chat to manage tasks:

### Command examples

**List tasks:**

```
@workspace List all my tasks
```

**Start a task:**

```
@workspace Start task 001
```

**Finish a task:**

```
@workspace Finish task 001
```

**Pause a task:**

```
@workspace Pause task 001 in progress
```

**Get details:**

```
@workspace Show details of task 002
```

**Validate tasks:**

```
@workspace Validate all project tasks
```

## Available Tools

Taskin's MCP server exposes the following tools to Copilot:

| Tool          | Description                                   |
| ------------- | --------------------------------------------- |
| `start_task`  | Starts a task (changes status to in-progress) |
| `finish_task` | Finishes a task (changes status to done)      |
| `pause_task`  | Pauses a task in progress                     |
| `list_tasks`  | Lists all tasks with optional filters         |
| `get_task`    | Gets complete details of a task               |
| `lint_tasks`  | Validates task formatting and content         |

## Verifying it's working

1. Open GitHub Copilot Chat in VS Code
2. Type `@workspace` and check if Copilot can access the tools
3. Test with: `@workspace List tasks`

## Troubleshooting

### Server doesn't appear

- Check if GitHub Copilot is active and updated
- Reload the window: `Cmd+Shift+P` → "Developer: Reload Window"
- Verify the CLI path in settings.json

### Error starting server

- Make sure the CLI was built: `pnpm build --filter=taskin`
- Check if Node.js is in PATH
- View logs: `Cmd+Shift+P` → "Developer: Show Logs" → Extension Host

### Server doesn't find TASKS/

- Check the `cwd` in settings.json
- Use `${workspaceFolder}` to point to the project directory
- Run `taskin init` in the project if not yet initialized

## Team Configuration

For the entire team to use Taskin via MCP:

1. Create `.vscode/settings.json` in the repository:

```json
{
  "github.copilot.chat.mcpServers": {
    "taskin": {
      "args": ["taskin", "mcp-server"],
      "command": "npx",
      "cwd": "${workspaceFolder}"
    }
  }
}
```

2. Add to `.vscode/extensions.json`:

```json
{
  "recommendations": ["github.copilot", "github.copilot-chat"]
}
```

3. Instruct the team to install Taskin globally:

```bash
npm install -g taskin
# or
pnpm add -g taskin
```

## MCP Advantages in VS Code

✅ **Natural integration** - Use natural language to manage tasks
✅ **Code context** - Copilot understands the code you're working on
✅ **Stay in the editor** - No need to switch windows or use terminal
✅ **Entire team** - Share via `.vscode/settings.json`
✅ **Automation** - Copilot can suggest actions based on context

## Next Steps

1. Configure MCP in your VS Code
2. Test with some tasks
3. Share the configuration with the team via `.vscode/settings.json`
4. Enjoy task management via chat! 🚀
