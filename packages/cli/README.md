# Taskin

> Task management system integrated with Git workflows

Taskin is a command-line tool that helps you manage tasks directly from your terminal, with seamless Git integration and **dynamic provider loading**.

[![npm version](https://img.shields.io/npm/v/taskin.svg)](https://www.npmjs.com/package/taskin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Multiple Task Providers** - File System, Redmine, Jira, GitHub Issues (and more!)
- 🔌 **Dynamic Provider Installation** - Automatically installs providers when needed
- 📦 **Lightweight CLI** - Only installs what you use
- 🔒 **Secure Configuration** - API keys protected in `.gitignore`
- 🎨 **Beautiful CLI** - Colorful, interactive, and user-friendly
- ⚡ **Fast & Efficient** - Built with performance in mind
- 🧪 **Well Tested** - Comprehensive test coverage

## 🚀 Installation

```bash

# Using npx (recommended - no installation needed!)

npx taskin init

# Or install globally

npm install -g taskin

# Or with pnpm

pnpm add -g taskin

# Or with yarn

yarn global add taskin
```

> **Note:** Please report any issues on [GitHub](https://github.com/sidartaveloso/taskin/issues).

## 📦 Available Packages

Taskin is built as a modular ecosystem. Besides the CLI, you can use individual packages:

### Core Packages

| Package                           | Description                      | npm                                                                                     |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| **taskin**                        | Complete CLI + programmatic API  | [![npm](https://img.shields.io/npm/v/taskin.svg)](https://www.npmjs.com/package/taskin) |
| **@opentask/taskin-types**        | TypeScript types and Zod schemas | Coming soon                                                                             |
| **@opentask/taskin-core**         | Core task management logic       | Coming soon                                                                             |
| **@opentask/taskin-task-manager** | Task lifecycle orchestration     | Coming soon                                                                             |

### Task Providers

| Provider                                  | Description                           | Status         | npm         |
| ----------------------------------------- | ------------------------------------- | -------------- | ----------- |
| **@opentask/taskin-file-system-provider** | File System provider (Markdown files) | ✅ Stable      | Coming soon |
| **@opentask/taskin-redmine-provider**     | Redmine integration                   | 🚧 Coming Soon | -           |
| **@opentask/taskin-jira-provider**        | Jira Cloud integration                | 🚧 Coming Soon | -           |
| **@opentask/taskin-github-provider**      | GitHub Issues integration             | 🚧 Coming Soon | -           |

### Utilities

| Package                        | Description          | npm         |
| ------------------------------ | -------------------- | ----------- |
| **@opentask/taskin-git-utils** | Git workflow helpers | Coming soon |
| **@opentask/taskin-utils**     | Shared utilities     | Coming soon |

> 💡 **Tip:** When you run `taskin init`, providers are automatically installed on-demand. You don't need to install them manually!

## Quick Start

1. **Initialize Taskin in your project:**
   \`\`\`bash
   npx taskin init
   \`\`\`

   Select your preferred task provider:
   - 📁 **File System** - Store tasks as Markdown files locally
   - 🔴 **Redmine** - Sync with Redmine issues (coming soon)
   - 🔵 **Jira** - Sync with Jira issues (coming soon)
   - 🐙 **GitHub Issues** - Sync with GitHub (coming soon)

2. **List all tasks:**
   \`\`\`bash
   taskin list
   taskin list --json   # JSON array, for another tool to consume
   \`\`\`

3. **Start working on a task:**
   \`\`\`bash
   taskin start task-001
   \`\`\`

## Commands

- `taskin init` - Initialize Taskin in your project with interactive setup
- `taskin list [options]` - List all tasks
  - `--open` - Show only open tasks (pending, in-progress, blocked)
  - `--closed` - Show only closed tasks (done, canceled)
  - `--status <status>` - Filter by specific status
  - `--type <type>` - Filter by task type
- `taskin new` - Create a new task (alias: `create`)
- `taskin start <id>` - Start working on a task (suggests commits)
- `taskin pause <id>` - Pause work on a task (auto-commits work in progress)
- `taskin review <id>` - Mark a task as ready for review
- `taskin finish <id>` - Complete a task (suggests commits)

`new`, `start`, `review` and `finish` each accept `--no-skip-ci`. See
[The CI-skip tag](#the-ci-skip-tag).
- `taskin stats [options]` - Show statistics
  - `--user` - User statistics
  - `--team` - Team statistics
  - `--period <day|week|month|year>` - Time period for stats
- `taskin config [options]` - Configure automation level
  - `--level <manual|assisted|autopilot>` - Set commit automation level
- `taskin lint` - Validate task files
- `taskin dashboard [options]` - Start the web dashboard
  - `--filter-open` - Show only open tasks
  - `--filter-closed` - Show only closed tasks
- `taskin mcp-server` - Start MCP server for Claude Desktop integration (alias: `mcp`)
- `taskin mcp-install` - Register the MCP server in this project's `.mcp.json`
  - `-f, --force` - Replace an existing `taskin` entry that differs
  - `--no-probe` - Skip starting the server to verify the entry works
- `taskin help` - Show help information

### The CI-skip tag

The commits Taskin writes on its own carry a tag so a status change does not
burn a pipeline run — `[skip ci]` by default, configurable per project as
`automation.ciSkipTag` in `.taskin.json`. An empty string appends nothing, which
is how a project asks for CI to run on those commits too.

There is one case the project-wide setting cannot get right. GitHub reads
**only the head commit of a push**. When you commit your work and then run
`taskin finish`, the status commit lands on top — and its tag skips the whole
push, including the release of the work you just finished.

For that push, turn the tag off for the one call:

```bash
taskin finish 042 --no-skip-ci
```

The flag only turns the tag off. There is no way to force it on in a project
that configured an empty string: a project that asked for "CI always" has no use
for skipping case by case.

### Automation Levels

Taskin supports three automation levels for git commits:

- **manual** - You're in control: all commits are suggestions only
- **assisted** (default) - Smart suggestions: auto-commits status changes, suggests work commits
- **autopilot** - Let Taskin drive: auto-commits everything

Configure with: `taskin config --level <level>`

## 🤖 MCP Server (Model Context Protocol)

Taskin includes an MCP server that allows AI assistants like Claude Desktop to interact with your tasks:

```bash
taskin mcp-server
```

### Registering it in a project

```bash
taskin mcp-install
```

Writes `.mcp.json` at the **project root** — not wherever you ran it from, which
matters in a monorepo, where a subdirectory has no lockfile to detect the
package manager from. It merges with servers already configured there, leaves a
differing `taskin` entry alone until you pass `--force`, and refuses a malformed
file instead of destroying it.

Then it starts the server over stdio and compares the tools it advertises
against the ones this version offers. Asking only "did it answer?" is not
enough: the command can resolve to a *different* taskin — an older global
install answers happily, with the wrong set of tools. Skip the check with
`--no-probe`.

### Integration with Claude Desktop

**Available MCP Tools:**

- `list_tasks` - List tasks, with optional filters
- `start_task` - Start working on a task
- `finish_task` - Mark a task as finished

**Available MCP Prompts:**

- `start-task-workflow` - Guide for starting tasks
- `finish-task-workflow` - Guide for finishing tasks
- `task-summary` - Get task summary and insights

**Available MCP Resources:**

- `taskin://tasks` - Access all tasks

## 📦 Programmatic Usage

Taskin can also be used as a library in your TypeScript/JavaScript projects:

```bash
npm install taskin
```

```typescript
import { createTaskin, getTaskin, type ITaskin } from 'taskin';

// Create a Taskin instance with custom tasks directory
const taskin = createTaskin('./my-tasks');

// Or use the default instance (uses ./TASKS)
const taskin = getTaskin();

// Use the API
const tasks = await taskin.list();
await taskin.start('task-001');
await taskin.pause('task-001', { message: 'Break time!' });
await taskin.finish('task-001');

// Lint tasks
const lintResult = await taskin.lint({ path: './TASKS' });
console.log(`Checked ${lintResult.tasksChecked} tasks`);
```

### TypeScript Support

Taskin is written in TypeScript and exports full type definitions:

```typescript
import type { Task, TaskId, TaskStatus, ITaskin } from 'taskin';

// All types are available for your TypeScript projects
function processTask(task: Task): void {
  console.log(`Processing ${task.title}`);
}
```

## 🏗️ Architecture

Taskin uses a **plugin-based architecture** with dynamic provider loading:

- Providers are loaded on-demand (only when selected)
- Automatic installation via npm/pnpm/yarn
- Easy to extend with custom providers

📚 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📝 Creating Tasks

Use the `taskin new` command to create new task files:

### Interactive Mode (Recommended)

Simply run without arguments for a guided experience:

```bash
taskin new
```

You'll be prompted to select:

- Task type (feat, fix, refactor, docs, test, chore)
- Title
- Description (optional)
- Assignee (optional)

### Command-line Mode

Or provide all options directly:

```bash
# Create a new feature task
taskin new -t feat -T "Add user authentication" -d "Implement JWT-based auth" -u "John Doe"

# Create a bug fix task
taskin new --type fix --title "Fix login error" --user "Developer"

# Using the 'create' alias
taskin create -t docs -T "Update README"
```

**Options:**

- `-t, --type <type>` - Task type: feat, fix, refactor, docs, test, chore
- `-T, --title <title>` - Task title (required in command-line mode)
- `-d, --description <description>` - Task description
- `-u, --user <user>` - Assigned user

The command will:

1. Auto-generate a task number (e.g., 05)
2. Create a markdown file in `TASKS/` directory
3. Use a slug from the title for the filename
4. Pre-populate with a standard template

## �📖 Examples

See [EXAMPLES.md](./EXAMPLES.md) for detailed usage examples and workflows.

## 🔌 Available Providers

| Provider         | Status         | Package                                 |
| ---------------- | -------------- | --------------------------------------- |
| 📁 File System   | ✅ Stable      | `@opentask/taskin-file-system-provider` |
| 🔴 Redmine       | 🚧 Coming Soon | `@opentask/taskin-redmine-provider`     |
| 🔵 Jira          | 🚧 Coming Soon | `@opentask/taskin-jira-provider`        |
| 🐙 GitHub Issues | 🚧 Coming Soon | `@opentask/taskin-github-provider`      |

Want to create your own provider? See [ARCHITECTURE.md](./ARCHITECTURE.md#-criando-um-novo-provider).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Requirements

- Node.js >= 20.0.0
- npm/pnpm/yarn

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/sidartaveloso/taskin/issues).

## � Team

**OpenTask**

- Website: [opentask.com.br](https://opentask.com.br)
- Email: contato@opentask.com.br

**Contributors:**

- Sidarta Veloso ([@sidartaveloso](https://github.com/sidartaveloso))

## 📄 License

MIT © [OpenTask](https://opentask.com.br)
