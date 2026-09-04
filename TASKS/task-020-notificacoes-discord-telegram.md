# 🔔 Task 020 — Sistema de Notificações (Discord, Telegram, Webhook)

Status: done\
Type: feat\
Assignee: Sidarta Veloso\

## Description

Implementar um sistema de notificações baseado em providers para o Taskin, permitindo enviar mensagens automáticas para Discord, Telegram ou qualquer webhook HTTP quando tarefas são criadas, finalizadas ou enviadas para review.

Atualmente, notificações manuais são enviadas por programadores no Directus. Esta task automatiza esse fluxo usando a infraestrutura de hooks existente, mas com uma abstração mais robusta do que comandos `curl` avulsos.

## Context

### Problema

Programadores copiam manualmente mensagens como esta para o Directus/Discord:

> @Sidarta Veloso, @Joris Veloso e @Rafael Paviotti - { DEVIX } A tarefa task-037-analise-correcao-performance-dashboards-lecard.md foi ajustada conforme as considerações de @Sidarta Veloso. Ramo feat/task-037 commit/push.

Isso é repetitivo, propenso a erros e não escala para múltiplos canais.

### Solução Atual (Hooks Shell)

O Taskin já suporta command lifecycle hooks. Seria possível usar `curl` no post-hook:

```json
{
  "hooks": {
    "finish": {
      "post": ["curl -H 'Content-Type: application/json' -d '{...}' $DISCORD_URL"]
    }
  }
}
```

Mas esta abordagem tem limitações:
- Formatação de mensagens complexas (embeds) é difícil em shell
- Sem suporte nativo a múltiplos providers (Discord + Telegram + email)
- Sem testes unitários para a lógica de notificação
- Sem gerenciamento de erros consistente (retry, fallback)
- Sem template engine estruturada para mensagens

### Solução Proposta (Provider-Based)

Criar um sistema de notificações com:

1. **`INotificationProvider`** — Interface para enviar notificações
2. **`NotificationManager`** — Orquestra múltiplos providers, gerencia retry e fallback
3. **Providers concretos**: Discord (webhook), Telegram (bot API), Console (debug)
4. **`NotificationMessage`** — Mensagem estruturada com suporte a rich embeds
5. **Integração via post-hooks** — Usa o hook runner existente mas com comando interno `taskin notify`

## Proposed Solution

### Arquitetura

```
                    ┌─────────────────────────┐
                    │   Command Lifecycle      │
                    │  (finish, review, start) │
                    └────────┬────────────────┘
                             │ executa post-hooks
                             ▼
                    ┌─────────────────────────┐
                    │   HookRunner            │
                    │   executa "taskin notify"│
                    └────────┬────────────────┘
                             │ chama CLI notify
                             ▼
                    ┌─────────────────────────┐
                    │   NotificationManager   │
                    │   gerencia providers     │
                    └───┬─────────┬──────────┘
                        │         │
              ┌─────────▼──┐  ┌──▼──────────┐
              │ Discord     │  │ Telegram        │
              │ Provider    │  │ Provider     │
              └─────────────┘  └─────────────┘
```

### Fluxo de Notificação Automática

1. Usuário executa `taskin finish 020`
2. O comando muda status para `done`, faz auto-sync (git push)
3. O hook runner executa post-hooks configurados
4. Um dos post-hooks é `taskin notify --provider discord --event task:done`
5. O comando `notify` monta a mensagem usando o contexto da tarefa
6. O `NotificationManager` envia para cada provider configurado
7. Em caso de falha, faz retry (3 tentativas com backoff)

### Configuração no `.taskin.json`

```json
{
  "notifications": {
    "discord": {
      "webhookUrl": "${DISCORD_TASKIN_WEBHOOK_URL}",
      "mentions": {
        "Sidarta Veloso": "<@123456789>",
        "Joris Veloso": "<@987654321>",
        "Rafael Paviotti": "<@456789123>"
      },
      "events": ["task:done", "task:review", "task:start"]
    },
    "telegram": {
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "chatId": "${TELEGRAM_CHAT_ID}",
      "events": ["task:done"]
    }
  }
}
```

### Mensagens Ricas (Discord Embeds)

Exemplo de embed gerado automaticamente:

```json
{
  "embeds": [{
    "title": "Task #020 — Sistema de Notificações",
    "description": "Foi finalizada por **Sidarta Veloso**",
    "color": 5763719,
    "fields": [
      { "name": "Status", "value": "pending → done", "inline": true },
      { "name": "Ramo", "value": "feat/task-020", "inline": true },
      { "name": "Commits", "value": "3 commits", "inline": true }
    ],
    "footer": { "text": "Taskin • task-020" }
  }]
}
```

## Tasks (TDD Approach - Test First!)

### Phase 1: Interfaces & Types (Test-Driven)

- [x] **Write INotificationProvider contract tests** (`notification-provider.test.ts`)
  - Test interface contract (like ITaskProvider)
  - Test send() method signature
  - Test success/error return types

- [x] **Define INotificationProvider interface** (`@opentask/taskin-types`)

  ```ts
  export interface NotificationMessage {
    title: string;
    description: string;
    color?: number;
    fields?: NotificationField[];
    mentions?: string[];
    footer?: { text: string };
  }

  export interface NotificationField {
    name: string;
    value: string;
    inline?: boolean;
  }

  export interface NotificationResult {
    success: boolean;
    provider: string;
    error?: string;
    duration: number;
  }

  export interface INotificationProvider {
    readonly name: string;
    send(message: NotificationMessage): Promise<NotificationResult>;
  }
  ```

- [x] **Write NotificationConfig schema tests**
  - Test Discord webhook URL validation
  - Test Telegram bot token e chatId validation
  - Test events array validation
  - Test mentions mapping validation

- [x] **Add NotificationConfig to TaskinConfigSchema**
  - Discord, Telegram providers
  - Events filter (task:start, task:done, task:review)
  - Webhook URL (string, com suporte a env vars)
  - Optional mentions mapping

- [x] **Write NotificationMessageBuilder tests**
  - Test message building from task context
  - Test embed formatting
  - Test mention resolution (@nome → <@id>)

- [x] **Implement NotificationMessageBuilder**
  - Monta título, descrição, campos, cor
  - Resolve menções do config
  - Formata duração, número de commits
  - Make tests pass

### Phase 2: Discord Provider (Test-Driven)

- [x] **Write DiscordProvider tests** (`discord-provider.test.ts`)
  - Mock fetch/axios para webhook HTTP
  - Test success: 204 response
  - Test failure: 4xx/5xx response
  - Test network error → retry
  - Test embed formatting
  - Test mentioned role parsing

- [x] **Implement DiscordProvider**
  - Envia POST para webhook URL do Discord
  - Formata mensagem como embed Discord
  - Suporta menções (<@userId>, <@&roleId>)
  - Retry com backoff (3 tentativas)
  - Make tests pass

- [ ] **Write integration test with real webhook** (optional/skip in CI)
  - Usar webhook de teste do Discord
  - Verificar mensagem recebida
  - (Marcado como @skip in CI)

### Phase 3: Telegram Provider (Test-Driven)

- [x] **Write TelegramProvider tests** (`telegram-provider.test.ts`)
  - Mock fetch/axios para Bot API do Telegram
  - Test success: 200 OK com `{ ok: true }`
  - Test failure: 4xx/5xx da API
  - Test sendMessage com parse_mode=MarkdownV2
  - Test envio para chatId do grupo

- [x] **Implement TelegramProvider**
  - Envia POST para `https://api.telegram.org/bot<token>/sendMessage`
  - Usa `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` do ambiente
  - Formata mensagem como MarkdownV2 (negrito, itálico, links)
  - Suporta menções por username (`@username`)
  - Make tests pass

### Phase 4: NotificationManager (Test-Driven)

- [x] **Write NotificationManager tests** (`notification-manager.test.ts`)
  - Test notify all providers
  - Test partial failure (one provider fails, others succeed)
  - Test provider filtering by event
  - Test retry logic
  - Test empty provider list

- [x] **Implement NotificationManager**
  - Gerencia lista de providers registrados
  - Filtra providers por evento
  - Executa send() em paralelo
  - Coleta resultados
  - Retry com exponential backoff
  - Make tests pass

### Phase 5: CLI notify Command (Test-Driven)

- [x] **Write notify command tests** (`notify.test.ts`)
  - Test --provider flag
  - Test --event flag (task:done, task:start, task:review)
  - Test --task-id flag
  - Test dry-run mode (apenas mostra mensagem, não envia)
  - Test error when no providers configured

- [x] **Implement `taskin notify` command**
  - Lê configuração de notificações do `.taskin.json`
  - Carrega o contexto da tarefa atual
  - Monta a mensagem via NotificationMessageBuilder
  - Envia via NotificationManager
  - Mostra resultado (sucesso/falha por provider)
  - Make tests pass

### Phase 6: Integração com Command Lifecycle Hooks

- [x] **Adicionar notificação automática nos comandos**
  - `taskin finish` → envia `task:done` via `notify-helper.ts`
  - `taskin review` → envia `task:review` via `notify-helper.ts`
  - `taskin start` → envia `task:start` via `notify-helper.ts`

- [ ] **Escrever testes de integração**
  - Mock NotificationManager
  - Verificar que finish chama notificação com event=task:done
  - Verificar que review chama notificação com event=task:review
  - Verificar que start chama notificação com event=task:start

- [x] **Integrar notificações com auto-sync**
  - Quando autoSync=true, incluir info de commit na mensagem
  - Mostrar branch, número de commits, hash

### Phase 7: Console/Log Provider (Test-Driven)

- [x] **Write ConsoleProvider tests**
  - Test log formatting
  - Test color output (terminal ANSI)
  - Test structured JSON output (--json flag)

- [x] **Implement ConsoleProvider**
  - Loga notificação no terminal
  - Útil para debug e dry-run
  - Formata com cores ANSI
  - Make tests pass

### Phase 8: Error Handling & Retry (Test-Driven)

- [x] **Write retry logic tests**
  - Test exponential backoff
  - Test max retries
  - Test success on nth retry
  - Test permanent failure (4xx) → no retry

- [x] **Implement retry with backoff**
  - 3 tentativas: 1s, 3s, 5s de intervalo
  - Não retentar em 4xx (erro do cliente)
  - Retentar em 5xx e network errors
  - Make tests pass

### Phase 9: E2E / Smoke Tests

- [x] **Write notify.e2e.test.ts**
  - Criar task real em diretório temp
  - Configurar notificações no .taskin.json
  - Executar `taskin notify --event task:done`
  - Verificar que ConsoleProvider logou a mensagem

- [x] **Test dry-run mode in E2E**
  - Executar `taskin notify --dry-run`
  - Verificar saída sem enviar

- [ ] **Test full workflow: start → finish com notificação**
  - `taskin start 020`
  - `taskin finish 020`
  - Verificar que notificação foi disparada

### Phase 10: Documentation & Examples

- [ ] **Documentar sistema de notificações**
  - Como configurar Discord webhook
  - Como configurar Telegram bot
  - Template de mensagens
  - Variáveis de ambiente
  - Troubleshooting

- [x] **Adicionar examples no repositório**
  - `.taskin.json.example` com notificações
  - Script de setup de webhook
  - Exemplos de mensagens

## Technical Details

### File Structure

```
packages/types-ts/src/
├── taskin.schemas.ts
│   └── NotificationConfigSchema    # Schema de configuração
│   └── DiscordProviderSchema       # Discord-specific config
│   └── TelegramProviderSchema         # Telegram bot config
│   └── NotificationMessageSchema   # Message structure
└── taskin.types.ts
    ├── INotificationProvider        # New interface
    ├── NotificationMessage          # Structured message
    ├── NotificationField           # Embed field
    ├── NotificationResult          # Send result
    ├── NotificationConfig          # Root config type
    └── NotificationEvent           # 'task:start' | 'task:done' | 'task:review'

packages/cli/src/
├── commands/
│   ├── notify.ts                   # New notify command
│   └── notify.test.ts              # Unit tests (write first!)
├── lib/
│   ├── notification/
│   │   ├── notification-manager.ts          # Manager implementation
│   │   ├── notification-manager.test.ts     # Tests (write first!)
│   │   ├── notification-message-builder.ts  # Message builder
│   │   ├── notification-message-builder.test.ts
│   │   ├── providers/
│   │   │   ├── discord-provider.ts          # Discord webhook
│   │   │   ├── discord-provider.test.ts     # Tests (write first!)
│   │   │   ├── telegram-provider.ts            # Telegram Bot API
│   │   │   ├── telegram-provider.test.ts       # Tests (write first!)
│   │   │   ├── console-provider.ts          # Terminal log
│   │   │   └── console-provider.test.ts     # Tests (write first!)
│   │   └── retry.ts                         # Retry with backoff
│   └── config-manager.ts          # Update with getNotifications()
```

### Core Interfaces

```ts
// packages/types-ts/src/taskin.types.ts

export type NotificationEvent = 'task:start' | 'task:done' | 'task:review';

export interface NotificationField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface NotificationMessage {
  title: string;
  description: string;
  color?: number;
  fields?: NotificationField[];
  mentions?: string[];
  footer?: { text: string };
}

export interface NotificationResult {
  success: boolean;
  provider: string;
  error?: string;
  duration: number;
}

export interface INotificationProvider {
  readonly name: string;
  send(message: NotificationMessage): Promise<NotificationResult>;
}

export interface NotificationDiscordConfig {
  webhookUrl: string;
  mentions?: Record<string, string>;
  events: NotificationEvent[];
}

export interface NotificationTelegramConfig {
  botToken: string;
  chatId: string;
  events: NotificationEvent[];
}

export interface NotificationConfig {
  discord?: NotificationDiscordConfig;
  telegram?: NotificationTelegramConfig;
}
```

### Exemplo de Mensagem Gerada

**Cenário: finish task-020 com autoSync**

> **Task #020 — Sistema de Notificações**
>
> Foi finalizada por **Sidarta Veloso**
>
> 📋 **Status:** pending → done
> 🌿 **Ramo:** feat/task-020
> 📦 **Commits:** 3 (auto-sync)
> 🔗 **Arquivo:** TASKS/task-020-notificacoes-discord-telegram.md
>
> *Mensagem automática do Taskin*

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DISCORD_TASKIN_WEBHOOK_URL` | Webhook URL do Discord |
| `TELEGRAM_BOT_TOKEN` | Token do bot do Telegram |
| `TELEGRAM_CHAT_ID` | ID do chat/grupo no Telegram |
| `TASKIN_NOTIFY_DRY_RUN` | Se `true`, não envia notificações (debug) |

### Considerações de Segurança

- Webhook URLs são carregadas de variáveis de ambiente, não armazenadas em plain text no `.taskin.json`
- O config pode referenciar `${VAR_NAME}` que é resolvido em runtime
- Menções a usuários são configuradas uma vez (mapeamento nome → ID)
- TLS obrigatório para todas as requisições HTTP
