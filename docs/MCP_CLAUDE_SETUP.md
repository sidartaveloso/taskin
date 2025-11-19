# Como usar o servidor MCP com Claude Desktop

O servidor MCP do Taskin permite que o Claude Desktop interaja diretamente com suas tasks.

## Configuração

### 1. Localize o arquivo de configuração do Claude Desktop

**macOS:**

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**

```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**

```
~/.config/Claude/claude_desktop_config.json
```

### 2. Adicione a configuração do Taskin

Abra o arquivo de configuração e adicione:

```json
{
  "mcpServers": {
    "taskin": {
      "args": [
        "/Users/seu-usuario/repositorios/taskin/packages/cli/dist/index.js",
        "mcp-server"
      ],
      "command": "node",
      "cwd": "/Users/seu-usuario/repositorios/taskin"
    }
  }
}
```

**Importante:** Substitua os caminhos pelos caminhos reais do seu sistema.

### 3. Reinicie o Claude Desktop

Feche e abra o Claude Desktop para que as mudanças tenham efeito.

## Ferramentas Disponíveis

Após a configuração, você poderá usar os seguintes comandos no Claude:

### `start_task`

Inicia uma task

```
Por favor, inicie a task 001
```

### `finish_task`

Finaliza uma task

```
Finalize a task 001
```

### `pause_task`

Pausa uma task em andamento

```
Pause a task 001
```

### `list_tasks`

Lista todas as tasks

```
Liste todas as minhas tasks
```

### `get_task`

Obtém detalhes de uma task específica

```
Mostre os detalhes da task 001
```

### `lint_tasks`

Valida os arquivos de task

```
Valide todas as tasks
```

## Recursos Disponíveis

O servidor também expõe recursos que o Claude pode acessar:

- `task://{taskId}` - Contexto completo de uma task
- `tasks://status/{status}` - Tasks filtradas por status

## Prompts Disponíveis

- `start-task` - Template para iniciar uma task
- `review-task` - Template para revisar uma task

## Testando a Conexão

O servidor MCP está funcionando corretamente. Para testar manualmente:

```bash
cd /Users/seu-usuario/repositorios/taskin
node packages/cli/dist/index.js mcp-server
```

Você deve ver a mensagem "MCP server started successfully" e o servidor ficará aguardando mensagens JSON-RPC via stdin.

**Nota:** O servidor MCP usa stdio para comunicação com o Claude Desktop. Os logs aparecem em stderr enquanto as mensagens JSON-RPC são enviadas/recebidas via stdin/stdout.

## Troubleshooting

### Erro: "Cannot find module"

- Verifique se os caminhos no `claude_desktop_config.json` estão corretos
- Certifique-se de que o CLI foi buildado: `pnpm build --filter=taskin`

### Erro: "UserRegistry not found"

- Verifique se você está no diretório correto (deve conter a pasta TASKS)
- Execute `taskin init` se ainda não inicializou o projeto

### Claude não mostra as ferramentas

- Reinicie completamente o Claude Desktop
- Verifique se o arquivo de configuração está no local correto
- Veja os logs em: `~/Library/Logs/Claude/mcp*.log` (macOS)

## Exemplo de Uso

1. Abra o Claude Desktop
2. No chat, digite: "Liste minhas tasks"
3. O Claude usará a ferramenta `list_tasks` automaticamente
4. Você verá a lista de tasks do seu projeto

## Configuração Avançada

### Debug Mode

Para habilitar logs de debug:

```json
{
  "mcpServers": {
    "taskin": {
      "args": [
        "/path/to/taskin/packages/cli/dist/index.js",
        "mcp-server",
        "--debug"
      ],
      "command": "node",
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Múltiplos Projetos

Você pode configurar múltiplos servidores MCP, um para cada projeto:

```json
{
  "mcpServers": {
    "taskin-project-a": {
      "args": ["/path/to/taskin/cli/dist/index.js", "mcp-server"],
      "command": "node",
      "cwd": "/path/to/project-a"
    },
    "taskin-project-b": {
      "args": ["/path/to/taskin/cli/dist/index.js", "mcp-server"],
      "command": "node",
      "cwd": "/path/to/project-b"
    }
  }
}
```
