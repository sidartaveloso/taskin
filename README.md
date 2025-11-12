# Taskin

> Plataforma modular de gerenciamento de tarefas com sincronização em tempo real e integração com LLMs

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.0-green)](https://vuejs.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.2-yellow)](https://pinia.vuejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-orange)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple)](https://github.com/modelcontextprotocol)

## ✨ Features

- 🎯 **Provider-Agnostic**: Arquitetura baseada em interfaces (`ITaskProvider`, `ITaskManager`)
- 🔄 **Real-Time Sync**: Sincronização bidirecional via WebSocket com auto-reconnect
- 🤖 **LLM Integration**: Model Context Protocol (MCP) para Claude, GPT-4 e outros
- 🎨 **Modern UI**: Dashboard Vue 3 + Vite + Pinia com design system completo
- 📱 **Responsive**: Interface otimizada para desktop, tablet e mobile
- 💾 **Offline-First**: Cache local com sincronização automática ao reconectar
- 🔧 **Type-Safe**: TypeScript strict mode + Zod schemas
- 📦 **Monorepo**: pnpm workspaces com builds otimizados
- 🎭 **Storybook**: 30+ stories interativas com autodocs

## 🚀 Quick Start

### Instalação

```bash
# Clone o repositório
git clone https://github.com/opentask/taskin.git
cd taskin

# Instale as dependências
pnpm install

# Build todos os pacotes
pnpm -r build
npx taskin list

# View all commands
taskin --help

# Create a new task
taskin new -t feat -T "Add login feature" -u "Developer"
```

**🔍 Task Linter** - Validate your task markdown files (language-agnostic):

```bash

```

### Uso Básico

#### 1. CLI Task Management

```bash
# Inicializar projeto
taskin init

# Criar nova tarefa
taskin new "Implementar autenticação"

# Listar tarefas
taskin list

# Gerenciar tarefas
taskin start task-01
taskin pause task-01
taskin finish task-01
```

#### 2. Dashboard com WebSocket

```bash
# Iniciar servidor WebSocket + dashboard web
taskin dashboard

# Acesse: http://localhost:5173
# WebSocket: ws://localhost:3001
```

#### 3. Integração com LLMs (Claude, GPT-4)

```bash
# Iniciar servidor MCP
taskin mcp-server

# Configure no Claude Desktop (claude_desktop_config.json):
{
  "mcpServers": {
    "taskin": {
      "command": "taskin",
      "args": ["mcp-server"]
    }
  }
}
```

## 📦 Packages

### Core Packages

- **@opentask/taskin-core** - Abstrações e lógica central
- **@opentask/taskin-types-ts** - Schemas Zod e tipos TypeScript
- **@opentask/taskin-task-manager** - Orquestração de lifecycle de tarefas
- **@opentask/taskin-fs-provider** - Provider baseado em filesystem

### Server Packages

- **@opentask/taskin-task-server-ws** - Servidor WebSocket multi-client
- **@opentask/taskin-task-server-mcp** - Servidor Model Context Protocol
- **@opentask/taskin-api** - REST API (planejado)

### Frontend Packages

- **@opentask/taskin-task-provider-pinia** - Pinia store com WebSocket sync
- **@opentask/taskin-dashboard** - Dashboard Vue 3 + Vite

### CLI & Utils

- **@opentask/taskin-cli** - Interface de linha de comando
- **@opentask/taskin-git-utils** - Utilitários Git
- **@opentask/taskin-utils** - Funções compartilhadas

### Integration Packages (Planejado)

- **@opentask/taskin-directus-extension** - Extensão Directus CMS
- **@opentask/taskin-n8n-plugin** - Plugin n8n
- **@opentask/taskin-chatbot** - Integrações chatbot

### Python Packages (Planejado)

- **@opentask/taskin-types-py** - Modelos Pydantic gerados
- **@opentask/taskin-py-sdk** - SDK Python

## 🏗️ Arquitetura

```
Vue Dashboard (Pinia)
    ↕ WebSocket
TaskWebSocketServer
    ↕
TaskManager ← → TaskProvider
    ↕
FileSystem (Markdown)

LLM (Claude/GPT-4)
    ↕ MCP Protocol
TaskMCPServer
    ↕
TaskManager ← → TaskProvider
```

📚 [Documentação Completa de Arquitetura](./docs/ARCHITECTURE.md)

## 🛠️ Development

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- Git

### Setup

```bash
# Clone
git clone https://github.com/opentask/taskin.git
cd taskin

# Install
pnpm install

# Build
pnpm -r build
```

### Available Commands

#### Build & Development

- `pnpm build` - Build todos os pacotes
- `pnpm dev` - Watch mode
- `pnpm clean` - Limpar builds
- `pnpm typecheck` - Verificar tipos TypeScript
- `pnpm lint` - ESLint + validação de manifests
- `pnpm test` - Rodar testes
- `pnpm test:coverage` - Testes com coverage

### Estrutura de Tarefas

Cada tarefa é um arquivo Markdown com YAML frontmatter:

```markdown
---
id: task-01
title: Implementar autenticação
status: in-progress
priority: high
tags: [backend, security]
assignee: sidarta
created: 2024-01-15T10:00:00Z
---

## Descrição

Implementar sistema de autenticação JWT.

## Checklist

- [x] Criar schema
- [ ] Implementar login
```

## 📚 Documentação

- 📖 [Guia de Início Rápido](./docs/QUICKSTART.md)
- 🏗️ [Arquitetura Detalhada](./docs/ARCHITECTURE.md)
- 🎨 [Design System](./packages/dashboard/docs/design-specifications.md)
- 🔌 [WebSocket Examples](./packages/task-server-ws/EXAMPLES.md)
- 🤖 [MCP Server Guide](./packages/task-server-mcp/README.md)
- 📦 [Pinia Provider](./packages/task-provider-pinia/README.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie um branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para o branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Desenvolvimento

```bash
# Criar novo package
mkdir -p packages/novo-package/src
cd packages/novo-package

# Seguir padrão do monorepo
# Ver docs/QUICKSTART.md para detalhes
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **OpenTask** - [https://opentask.com.br](https://opentask.com.br)
- **Sidarta Veloso** - Contribuidor Principal

## 🙏 Agradecimentos

- Design system inspirado no [Redmine](https://example.com)
- Model Context Protocol por [Anthropic](https://github.com/anthropic-ai/model-context-protocol)
- Vue.js, Pinia, Vite e todo o ecossistema Vue

## 🔗 Links

- [Issues](https://github.com/opentask/taskin/issues)
- [Pull Requests](https://github.com/opentask/taskin/pulls)
- [Changelog](./CHANGELOG.md)

---

**Status**: Em desenvolvimento ativo 🚧

**Versão**: 0.1.0

Made with ❤️ by OpenTask
