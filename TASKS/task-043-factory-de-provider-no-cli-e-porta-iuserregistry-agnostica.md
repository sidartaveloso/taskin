# Task 043 — Factory de provider no CLI e porta IUserRegistry agnostica

Status: in-progress\
Type: refactor\
Assignee: sidarta-veloso\

## Description

Desbloquear providers alternativos no CLI. Hoje `provider.type` do `.taskin.json` e lido
**apenas** pelo `init`: todos os comandos instanciam `new FileSystemTaskProvider(...)` e
`new UserRegistry(...)` direto, em 13 lugares. Enquanto isso nao mudar, escolher outro provider
na configuracao nao tem efeito nenhum — foi o que deixou a task-002 (Redmine) parada em `paused`
mesmo com a spec pronta, e e o pre-requisito da task-041 (GitHub).

Refactor de codigo existente, sem feature nova: ao final, `taskin init -p <x>` seguido dos
comandos normais precisa usar o provider `<x>`, e o provider fs tem que continuar se comportando
exatamente como hoje.

## Tasks

- [x] Mover a porta `IUserRegistry` do `file-system-task-provider` para o `task-manager`, ao lado
      de `ITaskProvider`. Hoje a interface e declarada dentro do pacote fs, entao um
      `GitHubUserRegistry` teria que importar do provider de arquivos para implementa-la — mesmo
      defeito de fronteira que a task-031 corrigiu para o `TaskFile`, na direcao inversa. O
      `user-registry.contract.ts` ja existente passa a ser a suite que qualquer implementacao roda.
      **Nao** mover a implementacao file-backed (`UserRegistry` + `users-file-location` +
      `.taskin/.taskin-users.json`): e backing store de uma implementacao, nao configuracao de
      projeto, e um projeto com provider remoto nao tem esse arquivo.
- [x] Criar factory `resolveTaskProvider(config, deps)` lendo `provider.type` do `.taskin.json` e
      devolvendo o par `ITaskProvider` + `IUserRegistry` — os dois sao hardcoded juntos hoje, e um
      provider remoto resolve usuario pela API, nao por arquivo. Substituir os 13 call sites:
      `main.ts` + `commands/{new,start,pause,finish,review,list,lint,dashboard,mcp-server,init,export,stats}.ts`.
      `task-server-ws` e `task-server-mcp` recebem o provider por injecao, entao herdam de graca.
- [x] Erro claro quando o `provider.type` configurado nao tem implementacao instalada, reusando
      `provider-installer` e o `AVAILABLE_PROVIDERS` do `provider-registry` (que hoje lista
      `redmine`/`jira`/`github` como `coming-soon`) em vez de estourar um import.
- [x] Mover a geracao do proximo id de `commands/new.ts:186-197` para dentro do provider: o
      calculo `max(ids)+1` sobre `getAllTasks()` e semantica de arquivo. Num provider remoto o id
      vem do proprio store (o numero da issue), ou seja, `createTask` e quem o decide e o CLI so
      consome `CreateTaskResult.task.id`.
- [x] Expandir `${VAR}` na config do provider, reusando
      `packages/cli/src/lib/notification/env-resolver.ts` (que ja faz isso para o webhook do
      Discord). Necessario porque todo provider remoto precisa de credencial e o `.taskin.json` e
      versionado — sem isso o unico caminho e commitar segredo.
- [x] Testes: um provider fake registrado na factory provando que `provider.type` e respeitado
      ponta a ponta; regressao do provider fs nos comandos tocados; contract test do
      `IUserRegistry` rodando do novo lugar.

## Notes

- Como ficou: `packages/cli/src/lib/provider-factory/` e o unico lugar que nomeia um provider
  concreto, com um mapa `PROVIDER_BUILDERS` injetavel (o seam que os testes usam para provar que
  `provider.type` e respeitado). `init` e a excecao documentada: roda antes de existir
  `.taskin.json` e e ele quem escreve o `provider.type`, entao usar a factory la seria circular.
- A forma da task atravessa o CLI como `OpaqueTask` — `Task` com uma marca inatingivel. Tipar o
  bundle como `ITaskProvider<Task>` seria mentira que quebra em runtime (e por isso que os membros
  de `ITaskProvider` sao propriedades de funcao); com a marca, nenhum comando consegue fabricar uma
  task, so devolver as que o provider entregou — exatamente a garantia que `updateTask` precisa.
- Bug que apareceu no caminho: `list` construia o registry com `taskinDir` = raiz do projeto em vez
  de `.taskin/`, entao todo assignee caia em `createTemporaryUser` e o registro real nunca era lido.
  A centralizacao corrigiu junto.
- `new.ts` tinha uma copia inteira da criacao de task (numeracao, slug, template) que agora e
  `provider.createTask()`. Some tambem o `generateTaskMarkdown` duplicado — o do provider e
  i18n-aware.
- Mudanca de comportamento a declarar: `provider.type` diferente de `fs` agora **falha com
  mensagem explicita** em vez de silenciosamente usar arquivos. Quem tinha type errado na config
  passa a ver o erro.

- Desbloqueia [task-041](./task-041-github-task-provider-issues-como-registro-e-projects-v2-como-projecao.md)
  (GitHub) e [task-002](./task-002-add-redmine-support.md) (Redmine, `paused`). Era a "Fase 0"
  da task-041 e saiu de la por ter perfil diferente: refactor em codigo existente, com risco de
  regressao no que ja funciona, contra pacote novo onde nada quebra se estiver errado.
- Continua a [task-031](./task-031-revisar-se-task-manager-deveria-lidar-com-taskfile-ou-task.md),
  que tornou `ITaskProvider`/`ITaskManager` genericos sobre a forma da task. Aquela task tirou o
  vazamento de tipo; esta tira o vazamento de instanciacao.
- Criterio de aceite: `taskin init -p <provider>` seguido de `new`/`start`/`list`/`lint` usa o
  provider configurado, sem nenhum `new FileSystemTaskProvider` fora da factory; a suite atual
  passa sem alteracao de comportamento no provider fs.
