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

\`\`\`bash

# Using npx (recommended - no installation needed!)

npx taskin init

# Or install globally

npm install -g taskin

# Or with pnpm

pnpm add -g taskin

# Or with yarn

yarn global add taskin
\`\`\`

> **Note:** This is a beta version. Please report any issues on [GitHub](https://github.com/sidartaveloso/taskin/issues).

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

| Provider                              | Description                           | Status         | npm         |
| ------------------------------------- | ------------------------------------- | -------------- | ----------- |
| **@opentask/taskin-fs-provider**      | File System provider (Markdown files) | ✅ Stable      | Coming soon |
| **@opentask/taskin-redmine-provider** | Redmine integration                   | 🚧 Coming Soon | -           |
| **@opentask/taskin-jira-provider**    | Jira Cloud integration                | 🚧 Coming Soon | -           |
| **@opentask/taskin-github-provider**  | GitHub Issues integration             | 🚧 Coming Soon | -           |

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
   \`\`\`

3. **Start working on a task:**
   \`\`\`bash
   taskin start task-001
   \`\`\`

## Commands

- `taskin init` - Initialize Taskin in your project with interactive setup
- `taskin list` - List all tasks
- `taskin new` - Create a new task (alias: `create`)
- `taskin start <id>` - Start working on a task
- `taskin pause <id>` - Pause work on a task
- `taskin finish <id>` - Complete a task
- `taskin lint` - Validate task files

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

| Provider         | Status         | Package                             |
| ---------------- | -------------- | ----------------------------------- |
| 📁 File System   | ✅ Stable      | `@opentask/taskin-fs-provider`      |
| 🔴 Redmine       | 🚧 Coming Soon | `@opentask/taskin-redmine-provider` |
| 🔵 Jira          | 🚧 Coming Soon | `@opentask/taskin-jira-provider`    |
| 🐙 GitHub Issues | 🚧 Coming Soon | `@opentask/taskin-github-provider`  |

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
