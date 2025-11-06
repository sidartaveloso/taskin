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

> **Note:** This is a beta version. Please report any issues on [GitHub](https://github.com/opentask-app/taskin/issues).

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

- \`taskin init\` - Initialize Taskin in your project with interactive setup
- \`taskin list\` - List all tasks
- \`taskin start <id>\` - Start working on a task
- \`taskin pause <id>\` - Pause work on a task
- \`taskin finish <id>\` - Complete a task
- \`taskin lint\` - Validate task files

## 🏗️ Architecture

Taskin uses a **plugin-based architecture** with dynamic provider loading:

- Providers are loaded on-demand (only when selected)
- Automatic installation via npm/pnpm/yarn
- Easy to extend with custom providers

📚 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📖 Examples

See [EXAMPLES.md](./EXAMPLES.md) for detailed usage examples and workflows.

## 🔌 Available Providers

| Provider         | Status         | Package                           |
| ---------------- | -------------- | --------------------------------- |
| 📁 File System   | ✅ Stable      | \`@taskin/fs-task-provider\`      |
| 🔴 Redmine       | 🚧 Coming Soon | \`@taskin/redmine-task-provider\` |
| 🔵 Jira          | 🚧 Coming Soon | \`@taskin/jira-task-provider\`    |
| 🐙 GitHub Issues | 🚧 Coming Soon | \`@taskin/github-task-provider\`  |

Want to create your own provider? See [ARCHITECTURE.md](./ARCHITECTURE.md#-criando-um-novo-provider).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Requirements

- Node.js >= 20.0.0
- npm/pnpm/yarn

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/opentask-app/taskin/issues).

## � Team

**OpenTask**

- Website: [opentask.com.br](https://opentask.com.br)
- Email: contato@opentask.com.br

**Contributors:**

- Sidarta Veloso ([@sidartaveloso](https://github.com/sidartaveloso))

## 📄 License

MIT © [OpenTask](https://opentask.com.br)
