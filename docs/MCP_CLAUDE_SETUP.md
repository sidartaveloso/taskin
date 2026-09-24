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

O servidor expõe as ferramentas abaixo, e mais `list_groups` e `prioritize_tasks`. Esta lista é verificada por teste contra
o que o servidor anuncia — se divergir, a suíte quebra.

### `list_tasks`

Lista as tarefas do projeto. Devolve um JSON com o que identifica cada uma —
id, título, status, tipo, responsável — **sem o corpo do markdown**, que é
buscado depois pelo id.

Aceita filtros, todos opcionais e cumulativos: `status`, `type`, `assignee`
(id ou nome, inteiro ou em parte), `open`, `closed`, `active`, `all`, `scored`
(já tem dificuldade), `unscored` (ainda sem dificuldade) e `text` (busca livre).

**Sem criterio de status, devolve só as abertas.** `status`, `closed` e `active`
substituem esse padrão (não se somam a ele); `all: true` traz todas, fechadas
inclusive, e é recusado junto com `open`, `closed` ou `active`.

```
Liste as tasks em andamento
Quais tasks são da Ana?
```

### `set_priority`

Dá a uma task o seu lugar na fila. Recebe o `taskId` e **exatamente uma** de cinco
formas: `priority` (um número absoluto, inteiro a partir de 1 — menor vem antes),
`before` ou `after` (o id de outra task), `top: true` ou `bottom: true`. Uma task
agrupada vai ao topo ou ao fim do **próprio grupo**. As formas relativas gravam só
o que muda — normalmente um arquivo — e a resposta diz quantos (`changed`): levar
ao fim depois de uma cauda sem `Priority` numera a cauda, uma vez só.

```
Coloque a task 042 antes da 017
Leve a task 042 para o topo da fila
```

### `set_difficulty`

Pontua uma task: recebe o `taskId` e a `difficulty`, um inteiro de 1 (trivial) a
5 (muito difícil). É a ferramenta para a fila que `list_tasks` com
`unscored: true` devolve. Valor fora da faixa é recusado sem gravar. Não há como
tirar a dificuldade — pontuação errada se corrige pontuando de novo.

```
Pontue a task 042 com dificuldade 3
```

### `join_group` e `leave_group`

Põe uma task num grupo que já existe, ou tira do grupo em que estiver. Só são
anunciadas quando o provider tem o conceito de grupo; um grupo ou uma task que
não existem são recusados dizendo qual.

```
Coloque a task 042 no grupo g-cli
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

- `taskin://tasks` — todas as tarefas, fechadas inclusive, em JSON, no mesmo
  formato do `list_tasks` com `all: true`.

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
