# Sistema de Notificações

O Taskin pode enviar notificações automáticas para **Discord** e **Telegram** quando tarefas são iniciadas, finalizadas ou enviadas para review.

## Como funciona

Quando você executa `taskin start`, `taskin finish` ou `taskin review`, o comando verifica se há provedores de notificação configurados no `.taskin.json`. Se houver, ele monta uma mensagem estruturada e envia para cada provedor via:

- **Discord**: Webhook API (embeds)
- **Telegram**: Bot API (MarkdownV2)
- **Console**: log colorido no terminal (sempre ativo para debug)

## Configuração

### Via CLI interativa

```bash
taskin config
```

Selecione "Discord notification" ou "Telegram notification" e siga as instruções.

### Via CLI com flags

```bash
taskin config --discord-webhook '${DISCORD_TASKIN_WEBHOOK_URL}' --notification-events task:start,task:done
```

### Via edição direta do `.taskin.json`

```json
{
  "notifications": {
    "discord": {
      "webhookUrl": "${DISCORD_TASKIN_WEBHOOK_URL}",
      "events": ["task:start", "task:done", "task:review"]
    },
    "telegram": {
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "chatId": "${TELEGRAM_CHAT_ID}",
      "events": ["task:done"]
    }
  }
}
```

## Segurança: por que usar `${VAR_NAME}`?

### O problema

O `.taskin.json` normalmente é versionado no git (compartilhado com a equipe). Se você colocar o token do bot do Telegram ou a URL do webhook do Discord **literalmente** no arquivo:

```json
{
  "discord": {
    "webhookUrl": "https://discord.com/api/webhooks/123456/ABC-DEF",  // ⚠️ secreto no git!
  }
}
```

Qualquer pessoa com acesso ao repositório terá acesso ao webhook e poderá enviar mensagens no seu canal do Discord.

### A solução: separação de secrets via environment variables

```json
{
  "discord": {
    "webhookUrl": "${DISCORD_TASKIN_WEBHOOK_URL}",  // ✅ só uma referência
  }
}
```

O valor real fica **apenas** na environment variable:

```bash
# .zshrc, .bashrc, CI/CD secrets, etc.
export DISCORD_TASKIN_WEBHOOK_URL=https://discord.com/api/webhooks/123456/ABC-DEF
```

## .env file (por projeto)

Crie um arquivo `.env` na raiz do projeto (NÃO versionado no git):

```bash
DISCORD_TASKIN_WEBHOOK_URL=https://discord.com/api/webhooks/123456/ABC-DEF
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=-1001234567890
```

O Taskin carrega automaticamente o `.env` do diretório atual ao iniciar.
Isso permite cada projeto ter sua própria configuração sem poluir o shell global.

> O `.env` não sobrescreve env vars já definidas — se você exportou manualmente, esse valor tem prioridade.

### Por que isso é seguro?

| Aspecto | Sem env var | Com `${VAR_NAME}` |
|---------|-------------|-------------------|
| **Git** | Token visível em todo histórico | Só a referência `${VAR}` vai pro git |
| **Compartilhamento** | Todos veem o token | Cada dev tem seu próprio `.env` |
| **CI/CD** | Token embutido no config | Secret do GitHub/GitLab injetado via env |
| **Rotação** | Precisa alterar o config + git | Só trocar a env var |
| **Vazamento** | Se o repo vazar, token vaza junto | Env var não vaza |

### Como o Taskin resolve `${VAR_NAME}`

Em runtime, o `resolveEnvVars()` percorre as strings de configuração e substitui `${NOME}` por `process.env[NOME]`. Se a env var não existir, o valor resolve para string vazia e o provedor falha graciosamente — você verá o erro no console.

```
🔒 Security tip: use ${DISCORD_TASKIN_WEBHOOK_URL} instead of the literal URL
   to keep the webhook secret out of your .taskin.json file.
```

## Events disponíveis

| Evento | Disparado por | Descrição |
|--------|---------------|-----------|
| `task:start` | `taskin start` | Tarefa foi iniciada |
| `task:done` | `taskin finish` | Tarefa foi finalizada |
| `task:review` | `taskin review` | Tarefa enviada para review |

## Variáveis de ambiente

| Variável | Obrigatória para | Descrição |
|----------|------------------|-----------|
| `DISCORD_TASKIN_WEBHOOK_URL` | Discord | Webhook URL do canal do Discord |
| `TELEGRAM_BOT_TOKEN` | Telegram | Token do bot do Telegram |
| `TELEGRAM_CHAT_ID` | Telegram | ID do grupo/canal no Telegram |

## Testar sem enviar

```bash
taskin notify --event task:done --title "Teste" --description "Apenas um teste" --dry-run
```

O `--dry-run` mostra a mensagem que seria enviada sem chamar nenhuma API externa.

## Troubleshooting

1. **"No notification providers configured"** → configure via `taskin config`
2. **Discord retorna 401/404** → webhook URL inválida ou revogada
3. **Telegram retorna 401** → bot token inválido ou revogado
4. **Telegram retorna 403** → bot não é membro do grupo
5. **Notificações não disparam** → verifique se os eventos estão configurados corretamente no `.taskin.json`
