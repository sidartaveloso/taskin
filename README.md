# Taskin Monorepo

A modular, type-safe task management and automation system built with TypeScript and Python.

## 📦 Packages

### TypeScript Packages

- **@taskin/core** - Core task management logic and abstractions
- **@taskin/types-ts** - Shared TypeScript type definitions using Zod
- **@taskin/task-manager** - Task lifecycle management and orchestration
- **@taskin/fs-task-provider** - File system-based task provider
- **@taskin/git-utils** - Git utilities and integrations
- **@taskin/cli** - Command-line interface for task management
- **@taskin/api** - REST API for task management
- **@taskin/utils** - Shared utility functions

### Python Packages

- **@taskin/types-py** - Auto-generated Pydantic v2 models from TypeScript schemas
- **@taskin/py-sdk** - Python SDK for Taskin

### Integration Packages

- **@taskin/directus-extension** - Directus CMS extension
- **@taskin/n8n-plugin** - n8n workflow automation plugin
- **@taskin/chatbot** - Chatbot integrations

## 🚀 Getting Started

This monorepo uses **pnpm workspaces** with **Turborepo** for efficient task orchestration and caching.

### Prerequisites

Ensure you have [ASDF](https://asdf-vm.com/) installed to manage runtime versions:

- **Node.js** ≥20.0.0
- **pnpm** ≥10.20.0
- **Python** ≥3.10
- **uv** - Fast Python package installer

### Quick Start - CLI

The Taskin CLI is the fastest way to start managing tasks:

```bash
# Install globally
npm install -g taskin

# Or use with npx (no installation)
npx taskin list

# View all commands
taskin --help

# Create a new task
taskin new -t feat -T "Add login feature" -u "Developer"
```

**🔍 Task Linter** - Validate your task markdown files (language-agnostic):

```bash
# Validate TASKS/ directory
taskin lint

# Validate custom directory
taskin lint --path ./my-project/TASKS
```

📚 [Full Linter Documentation](./docs/TASK_LINTER_USAGE.md) - Includes examples for Python, Ruby, Rust, CI/CD integration, and more.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/taskin.git
   cd taskin
   ```

2. Install runtime versions:

   ```bash
   asdf install
   ```

3. Install Node.js dependencies:

   ```bash
   pnpm install
   ```

4. Build all packages:

   ```bash
   pnpm build
   ```

5. (Optional) Set up Python environment for types-py package:
   ```bash
   cd packages/types-py
   uv sync --extra dev
   ```

## 🛠️ Development

### Available Commands

#### Build & Development

- `pnpm build` - Build all packages with Turbo caching
- `pnpm dev` - Run all packages in watch mode
- `pnpm clean` - Remove build artifacts and caches
- `pnpm typecheck` - Type-check all TypeScript packages

#### Code Quality

- `pnpm lint` - Lint all packages (ESLint + manifest + task validation)
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm lint:tasks` - Validate task markdown files
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm lint:manifests` - Validate package.json files

#### Testing

- `pnpm test` - Run all tests
- `pnpm test:coverage` - Run tests with coverage reports

#### CI/CD

- `pnpm ci` - Run full CI pipeline (typecheck + lint + test)

### Type Generation Workflow

1. **TypeScript → JSON Schema**: Zod schemas in `types-ts` are converted to JSON Schema
2. **JSON Schema → Python**: Python Pydantic v2 models are auto-generated in `types-py`

This ensures type safety across the entire stack!

## 🏗️ Architecture

### Monorepo Structure

```
taskin/
├── packages/           # All packages
│   ├── core/          # Core abstractions
│   ├── types-ts/      # TypeScript types (source of truth)
│   ├── types-py/      # Generated Python types
│   ├── task-manager/  # Task orchestration
│   └── ...
├── eslint/            # Shared ESLint configs
├── dev/               # Development tools
└── TASKS/             # Project tasks
```

### Technology Stack

- **Language**: TypeScript (ES Modules), Python
- **Package Manager**: pnpm with workspaces
- **Build System**: Turborepo for monorepo orchestration
- **Type Safety**: Zod (runtime validation) + TypeScript
- **Testing**: Vitest
- **Linting**: ESLint 9 (flat config)
- **Formatting**: Prettier with plugins
- **Python Tooling**: uv, Ruff, mypy, pytest

### Code Quality

- ✅ **Strict TypeScript** - No `any` types allowed
- ✅ **Sorted imports** - Automatic import organization
- ✅ **Sorted keys** - Consistent object property ordering
- ✅ **Composite projects** - TypeScript project references for fast builds
- ✅ **Format on save** - VSCode integration configured

## 📝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing patterns
3. Run `pnpm ci` to ensure everything passes
4. Submit a pull request

## 📄 License

MIT

## 👥 Authors

**OpenTask** - [opentask.com.br](https://opentask.com.br)

### Contributors

- **Sidarta Veloso** - [GitHub](https://github.com/sidartaveloso) | [LinkedIn](https://www.linkedin.com/in/sidartaveloso)
