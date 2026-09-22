# Como usar o servidor MCP com Claude Desktop

O servidor MCP do Taskin permite que o Claude Desktop interaja diretamente com suas tasks.

## No seu projeto: um comando

Para agentes que leem o `.mcp.json` do repositório — Claude Code, por exemplo —
não é preciso escrever nada à mão:

```bash
taskin mcp-install
```

Ele escreve o arquivo na **raiz do projeto**, detecta o gerenciador de pacotes,
funde com os servidores já configurados e depois sobe o servidor para conferir
que a entrada funciona de verdade. Essa última parte importa: um comando pode
alcançar **outro** taskin — uma instalação global mais antiga responde
normalmente, com o conjunto errado de ferramentas — e só comparar as ferramentas
anunciadas distingue os dois casos.

Use `--force` para substituir uma entrada `taskin` divergente e `--no-probe`
para pular a verificação.

O Claude **Desktop** não lê o `.mcp.json` do repositório: ele tem configuração
própria, que é o que o resto deste documento descreve.

## Configuração do Claude Desktop

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

O servidor expõe **três** ferramentas. Esta lista é verificada por teste contra
o que o servidor anuncia — se divergir, a suíte quebra.

### `list_tasks`

Lista as tarefas do projeto. Devolve um JSON com o que identifica cada uma —
id, título, status, tipo, responsável — **sem o corpo do markdown**, que é
buscado depois pelo id.

Aceita filtros, todos opcionais e cumulativos: `status`, `type`, `assignee`
(id ou nome, inteiro ou em parte), `open`, `closed` e `text` (busca livre).

```
Liste as tasks em andamento
Quais tasks são da Ana?
```

### `start_task`

Inicia uma task, mudando o status para `in-progress`.

```
Por favor, inicie a task 001
```

### `finish_task`

Finaliza uma task, mudando o status para `done`.

```
Finalize a task 001
```

### O que ainda não existe

Três ferramentas já foram documentadas aqui **antes de existirem**, e continuam
não existindo. Nenhuma delas é oferecida pelo servidor:

- **get_task** — use `list_tasks` e leia o arquivo da task pelo id.
- **pause_task** — use `taskin pause` no terminal.
- **lint_tasks** — use `taskin lint` no terminal.

## Recursos Disponíveis

O servidor expõe um recurso:

- `taskin://tasks` — todas as tarefas, em JSON, no mesmo formato do
  `list_tasks` sem filtro.

`task://{taskId}` e `tasks://status/{status}` já apareceram nesta lista e não
existem.

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
