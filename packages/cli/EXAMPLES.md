# 🎬 Taskin Init - Exemplo de Uso

## Fluxo Completo

### Cenário 1: Provider já instalado (File System)

```bash
$ npx taskin init

╔════════════════════════════════════════╗
║   🎯 Initializing Taskin               ║
╚════════════════════════════════════════╝

? Select a task provider: (Use arrow keys)
❯ 📁 File System ✓ - Store tasks as Markdown files in a local TASKS/ directory
  🔴 Redmine (coming soon) - Sync tasks with Redmine issues via REST API
  🔵 Jira (coming soon) - Sync tasks with Jira issues via REST API
  🐙 GitHub Issues (coming soon) - Sync tasks with GitHub Issues

ℹ Setting up task provider: File System

ℹ Creating TASKS directory...
✓ Created TASKS/ directory
ℹ Creating sample task...
✓ Created sample task task-001-setup-project.md
ℹ Creating configuration file...
✓ Created .taskin.json
ℹ Adding .taskin.json to .gitignore...
✓ Updated .gitignore

✅ 🎉 Taskin initialized successfully!

ℹ Next steps:
  1. Run: taskin list
  2. Edit or create tasks in TASKS/
  3. Start working: taskin start <task-id>

ℹ For more information, run: taskin --help
```

### Cenário 2: Provider não instalado (Redmine)

```bash
$ npx taskin init

╔════════════════════════════════════════╗
║   🎯 Initializing Taskin               ║
╚════════════════════════════════════════╝

? Select a task provider: (Use arrow keys)
  📁 File System ✓ - Store tasks as Markdown files in a local TASKS/ directory
❯ 🔴 Redmine - Sync tasks with Redmine issues via REST API
  🔵 Jira (coming soon) - Sync tasks with Jira issues via REST API
  🐙 GitHub Issues (coming soon) - Sync tasks with GitHub Issues

ℹ Setting up task provider: 🔴 Redmine

⚠️  Provider @taskin/redmine-task-provider is not installed.

📦 Installing @taskin/redmine-task-provider...
npm install @taskin/redmine-task-provider
✅ @taskin/redmine-task-provider installed successfully!

ℹ Configuring 🔴 Redmine...

? Redmine server URL (e.g., https://redmine.example.com): https://redmine.mycompany.com
? Your Redmine API key: [hidden]
? Project identifier or ID: my-project

✓ 🔴 Redmine configuration saved

ℹ Creating configuration file...
✓ Created .taskin.json
ℹ Adding .taskin.json to .gitignore...
✓ Updated .gitignore

✅ 🎉 Taskin initialized successfully!

ℹ Next steps:
  1. Run: taskin list
  2. Tasks will be synced with 🔴 Redmine
  3. Start working: taskin start <task-id>

ℹ For more information, run: taskin --help
```

## Arquivo .taskin.json Gerado

### File System Provider

```json
{
  "provider": {
    "config": {
      "tasksDir": "TASKS"
    },
    "type": "fs"
  },
  "version": "1.0.3"
}
```

### Redmine Provider

```json
{
  "provider": {
    "config": {
      "apiKey": "abc123def456...",
      "apiUrl": "https://redmine.mycompany.com",
      "projectId": "my-project"
    },
    "type": "redmine"
  },
  "version": "1.0.3"
}
```

### Jira Provider (futuro)

```json
{
  "provider": {
    "config": {
      "apiToken": "xyz789...",
      "apiUrl": "https://mycompany.atlassian.net",
      "email": "user@company.com",
      "projectKey": "PROJ"
    },
    "type": "jira"
  },
  "version": "1.0.3"
}
```

## Detecção de Package Manager

O CLI detecta automaticamente qual package manager usar:

```
📁 Project Structure:
├── pnpm-lock.yaml     → Usa: pnpm add
├── yarn.lock          → Usa: yarn add
└── package-lock.json  → Usa: npm install
```

## Validação Automática

Todos os campos são validados automaticamente:

```bash
? Redmine API URL: invalid-url
✖ Please enter a valid URL starting with http:// or https://

? Redmine API URL: https://redmine.mycompany.com
✔ Valid!

? Your Redmine API key:
✖ API key is required

? Your Redmine API key: abc123
✔ Valid!
```

## Campos Secretos

Campos marcados como `secret: true` no schema usam password input:

```bash
? Your Redmine API key: ********  # Hidden input
? GitHub Personal Access Token: ********  # Hidden input
```

## Re-inicialização

```bash
$ npx taskin init

❌ Taskin is already initialized in this project
ℹ Use --force to reinitialize

$ npx taskin init --force

╔════════════════════════════════════════╗
║   🎯 Initializing Taskin               ║
╚════════════════════════════════════════╝

⚠️  This will overwrite your existing configuration!

? Select a task provider: ...
```

## Integração com Git

O CLI automaticamente adiciona `.taskin.json` ao `.gitignore`:

```gitignore
# ... existing entries

# Taskin configuration
.taskin.json
```

Isso protege credenciais sensíveis (API keys, tokens) de serem commitadas.

## Performance

| Ação                            | Tempo              |
| ------------------------------- | ------------------ |
| Listar providers                | ~10ms              |
| Verificar instalação            | ~50ms              |
| Instalar provider (já no cache) | ~2s                |
| Instalar provider (download)    | ~5-10s             |
| Configurar provider             | Depende do usuário |
| Criar .taskin.json              | ~5ms               |

## Comparação com Outras Ferramentas

### create-vite

```bash
$ npm create vite@latest
? Select a framework: › React
? Select a variant: › TypeScript
# Instala template automaticamente
```

### create-next-app

```bash
$ npx create-next-app@latest
? Would you like to use TypeScript? › Yes
? Would you like to use ESLint? › Yes
# Instala dependências automaticamente
```

### taskin init

```bash
$ npx taskin init
? Select a task provider: › Redmine
? Redmine API URL: › https://...
# Instala provider automaticamente
```

✅ **Mesma UX!**
