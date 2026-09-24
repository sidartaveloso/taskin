---
layout: home

hero:
  name: Taskin
  text: Suas tarefas, onde você quiser que elas morem.
  tagline: >
    Uma camada de gerenciamento de tarefas que não amarra você ao lugar onde
    elas ficam. O mesmo CLI, o mesmo dashboard em tempo real e a mesma ponte
    para o seu agente de IA — com a tarefa em markdown local, no Redmine, no
    Jira ou no GitHub Issues.
  actions:
    # Apontam para os documentos que existem hoje, no repositorio. Quando as
    # paginas de guia entrarem, viram links internos.
    - theme: brand
      text: Começar
      link: https://github.com/opentask/taskin/blob/main/docs/QUICKSTART.md
    - theme: alt
      text: Arquitetura
      link: https://github.com/opentask/taskin/blob/main/docs/ARCHITECTURE.md
    - theme: alt
      text: GitHub
      link: https://github.com/opentask/taskin

features:
  - icon: 🔌
    title: O provider é sua escolha
    details: >
      Você decide no taskin init onde as tarefas ficam. O provider é um plugin
      instalado sob demanda, e trocá-lo não muda nada no resto: os comandos, o
      painel e as métricas continuam iguais.
  - icon: 🧩
    title: O domínio não sabe onde a tarefa mora
    details: >
      ITaskProvider e ITaskManager são genéricos sobre a forma da tarefa. Quem
      implementa um provider novo enriquece esse formato com o que o seu
      backend precisa, sem tocar no núcleo.
  - icon: 🤖
    title: Seu agente enxerga as tarefas
    details: >
      Um servidor MCP expõe start, finish e list como ferramentas. Claude, GPT
      ou qualquer cliente do Model Context Protocol trabalha na mesma fila que
      você — seja ela um diretório ou um projeto no Jira.
  - icon: 🔄
    title: Tempo real, e offline quando precisa
    details: >
      WebSocket bidirecional com reconexão automática. O dashboard guarda cache
      local e sincroniza quando a conexão volta, qualquer que seja o provider
      atrás dele.
  - icon: ⚙️
    title: Git no automático, na medida que você escolhe
    details: >
      Três níveis de automação — manual, assistido e autopilot. O commit de
      status, o push e o squash acontecem no ramo que você configurar, ou não
      acontecem. O commit de status leva só o arquivo da task, e o commit
      automático que levaria um .env ou um token é recusado.
  - icon: 📈
    title: Métricas que saem do histórico
    details: >
      Duração por tarefa, ritmo por dia da semana, hora do dia e streak vêm do
      git, não de um cronômetro que alguém esqueceu de parar.
---

## O que é o Taskin

O Taskin é a camada entre você e a sua fila de trabalho. Ele dá um vocabulário
único — criar, começar, pausar, revisar, terminar — e um conjunto de ferramentas
em cima dele: uma CLI, um dashboard em tempo real, um servidor MCP para agentes
de IA e métricas tiradas do histórico do git.

**Onde as tarefas ficam guardadas é uma decisão sua**, tomada uma vez:

```bash
taskin init
```

```
? Escolha o provider de tarefas
❯ 📁 File System   — markdown num diretório TASKS/ do próprio repositório
  🔴 Redmine       — issues via REST API
  🔵 Jira          — issues via REST API
  🐙 GitHub Issues — issues do repositório
```

A escolha vai para o `provider.type` no `.taskin.json`, e todos os comandos a
respeitam. O provider é um pacote separado, instalado sob demanda — você não
carrega o cliente do Jira para usar markdown local, nem o contrário.

::: info Status hoje
O provider de **File System** é estável e é o padrão. Redmine, Jira e GitHub
Issues estão no registro do `init` marcados como `coming-soon`: a arquitetura os
suporta e o contrato está pronto, mas os pacotes ainda não foram publicados.
:::

## O dashboard

O `taskin dashboard` abre um painel que lê as tarefas do provider configurado e
acompanha as mudanças por WebSocket — quando alguém roda `taskin finish` no
terminal, ou quando um agente chama `finish_task` pelo MCP, o card muda de
estado sem recarregar.

![Dashboard do Taskin com seis tarefas de exemplo: três em andamento, uma bloqueada e duas concluídas. Cada card mostra número, status, título, projeto, barra de progresso, horas estimadas e gastas, e a pessoa responsável. Uma das tarefas em andamento está atribuída a "Claude (agente MCP)".](/dashboard.png)

Os nomes aí são de exemplo — inclusive o agente, que aparece como responsável de
propósito: pelo servidor MCP, ele pega tarefa na mesma fila que o resto do time.

::: tip Como esta imagem é gerada
Ela sai da <LinkDaGaleria>galeria de componentes</LinkDaGaleria>, do estado `LandingShowcase`
do dashboard, gerada por `dev/scripts/gerar-imagem-do-dashboard.ts` — não é um
print à mão. Quando o dashboard mudar, é só rodar o script de novo.
:::

## O contrato que faz isso funcionar

Um provider responde por seis operações. É só isso que o Taskin precisa saber
sobre o seu backend:

```ts
interface ITaskProvider<TTask extends Task = Task> {
  initialize: () => Promise<void>;
  findTask: (taskId: TaskId) => Promise<TTask | undefined>;
  getAllTasks: () => Promise<TTask[]>;
  updateTask: (task: TTask) => Promise<void>;
  createTask: (options: CreateTaskOptions) => Promise<CreateTaskResult<TTask>>;
  lint: (fix?: boolean) => Promise<LintResult>;
}
```

O `TTask` genérico é o detalhe que evita vazamento: o provider de arquivos
acrescenta `content` e `filePath` à tarefa, um de Redmine acrescentaria o
`issueId` e o histórico de notas, e nada disso aparece no pacote agnóstico. Quem
consome apenas `Task` continua funcionando com qualquer provider.

O `ITaskManager` fica em cima, com as transições de estado e as operações
nomeadas — `startTask`, `finishTask`, `assignToGroup`, `setPriority`,
`moveBefore`, `moveToTop`, `moveGroupToTop`, `setDifficulty` e as demais — e é genérico sobre a mesma forma. A
CLI, o servidor MCP e o dashboard passam todos por ele: o WebSocket do dashboard
manda `set-priority` ou `assign-to-group`, nunca uma tarefa inteira para
sobrescrever. Uma tabela, `SUPERFICIES_DAS_OPERACOES`, diz onde cada operação
aparece — e acrescentar uma operação sem decidir as três superfícies não compila.

## O provider de arquivos, que é o padrão

Se você não usa um rastreador de issues, ou quer a tarefa viajando junto com o
código, o provider de File System guarda cada uma como um markdown no seu
repositório:

```markdown
# Task 042 — Contraste dos tokens de status

Status: in-progress
Type: chore
Assignee: sidartaveloso

## Description

Os tokens `--status-*-bg` com texto branco falham WCAG AA.

## Tasks

- [x] Medir o contraste de cada par cor/texto
- [ ] Decidir entre escurecer o token ou trocar a cor do texto
```

A linha `Assignee` guarda o id do usuário em `.taskin/.taskin-users.json`, e não
o nome de exibição; `taskin lint --fix` reescreve um nome de exibição para o id.

Sendo arquivo no repositório, algumas coisas vêm de graça: a mudança de escopo
aparece no diff do PR, a tarefa acompanha o ramo onde o trabalho está, conflito
se resolve com as ferramentas que você já usa, e busca é `grep`.

Nada disso é requisito do Taskin — é o que **esse** provider oferece. Com o
Jira, você troca essas propriedades pelas que o Jira dá.

## Para quem escreve código com um agente

O servidor MCP expõe a fila de trabalho como ferramentas, e o agente que já lê o
seu repositório passa a mexer nela:

Três filtros, iguais em todas as superfícies: `open` (tudo que não terminou), `closed`, e `active` — começou e não terminou, que é o que interessa na tela enquanto o trabalho acontece.

Sem filtro nenhum, a lista mostra só as abertas — na CLI, no `list_tasks` e no dashboard, porque a pergunta de quem abre a lista é o que falta fazer. Para ver todas, fechadas inclusive: `taskin list --all`, `all: true` no MCP, ou o botão **All** no dashboard. Um filtro de status explícito (`--status done`, `--closed`, `--active`) substitui esse padrão em vez de se somar a ele.

Outros dois separam a fila pela dificuldade: `scored` (já pontuada — o que se prioriza) e `unscored` (a fila do que ainda falta pontuar). Na tela de priorização do dashboard eles são um controle próprio, ao lado do modo de ordenação. A fila do `unscored` se trabalha de qualquer lugar: `taskin difficulty 042 3` no terminal, `set_difficulty` para um agente, ou o próprio quadro — de 1 (trivial) a 5 (muito difícil).


```
você:    "termina a task 042"
agente:  → finish_task(taskId: "042")
         → a tarefa muda de estado, o commit sai, o dashboard atualiza
```

O agente não sabe — nem precisa saber — se aquilo virou um arquivo alterado ou
uma chamada REST. Quem resolve isso é o provider.

O agente também organiza a fila que ele mesmo executa. `set_priority` coloca uma
tarefa por número, logo `before` ou `after` de outra, ou no `top` ou no
`bottom` da fila, `join_group` / `leave_group` a movem entre grupos, e
`move_group` move um grupo inteiro, com os membros juntos. O terminal tem as
mesmas operações — `taskin priority 042 --before 017`, `taskin priority 042 --top`,
`taskin group join 042 g-cli`, `taskin group move g-cli --top` — e ninguém
precisa editar o bloco de metadados à mão.

Registrar o servidor é um comando:

```bash
taskin mcp-install
```

Ele escreve o `.mcp.json` na raiz do projeto, funde com o que já estiver
configurado ali e depois sobe o servidor para conferir que a entrada funciona —
um comando que alcança **outro** taskin responde normalmente, com o conjunto
errado de ferramentas, e responder não é o mesmo que responder certo.

## O monorepo

| pacote | o que faz |
| --- | --- |
| `taskin` | A CLI: `init`, `new`, `start`, `finish`, `lint`, `prioritize`, `priority`, `group`, `dashboard`, `mcp-install`, `mcp-server` |
| `@opentask/taskin-types` | Schemas Zod e tipos do domínio |
| `@opentask/taskin-task-manager` | As transições de estado e o contrato `ITaskProvider` |
| `@opentask/taskin-file-system-provider` | O provider padrão, em markdown |
| `@opentask/taskin-task-server-mcp` | O servidor Model Context Protocol |
| `@opentask/taskin-task-server-ws` | O servidor WebSocket do tempo real |
| `@opentask/taskin-dashboard` | O painel Vue 3 |
| `@opentask/taskin-design-vue` | O design system, e o mascote aí em cima |
| `@opentask/ui-sense` | Componentes de sensor: face, pose e gestos |

Dá para usar só a CLI. Ou só o `task-manager`, com um provider seu, dentro da
sua própria ferramenta.

## O mascote, e o `ui-sense` por trás dele

Ele é um polvo porque o Taskin faz muitas coisas ao mesmo tempo com o mesmo
corpo. E o que está no topo da página não é imagem: é o componente `Taskin` do
design system, rodando de verdade — pisca sozinho e acompanha o seu cursor.

Ele também sabe espelhar um rosto. O `@opentask/ui-sense` faz detecção de face,
pose e gestos no próprio navegador, e o mascote é só um consumidor disso:

<MascotTrackingDemo />

Os outros 16 humores dele estão na
<LinkDaGaleria>galeria de componentes</LinkDaGaleria>.
