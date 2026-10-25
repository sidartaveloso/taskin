# 🧩 Task 105 — Agrupar e priorizar pela CLI e pelo MCP, sem editar o arquivo a mao

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 2500
- Group: g-n1xf2yf7
- Difficulty: 4

## Description
O taskin group cria, lista, renomeia e remove grupos, mas nao coloca uma task num grupo, e nao ha nenhum comando que defina prioridade. Hoje as duas coisas so acontecem no dashboard ou editando o bloco de metadados do arquivo — foi o que precisei fazer para agrupar as tasks 103, 068 e 104. O MCP tambem nao expoe: ele tem list_groups e prioritize_tasks, que numera tudo de uma vez, mas nada que mova uma task para um grupo ou lhe de uma prioridade. Fechar a lacuna nas tres superficies, no molde dos comandos que ja existem.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `taskin group join <task> <grupo>` e `taskin group leave <task>` — `packages/cli/src/commands/group.ts`; e2e `taskin group join / leave > poe a tarefa num grupo que existe, e tira` em `packages/cli/src/commands/group-priority.e2e.test.ts`
- [x] Prioridade pela CLI — decidido `taskin priority <task> [n] | --before <task> | --after <task>`, uma forma por chamada (`packages/cli/src/commands/priority.ts`); e2e `taskin priority > ...` (numero, `--before` gravando um arquivo so, `--after`, exatamente uma forma)
- [x] `--group` e `--priority` no `taskin new`, para a task ja nascer no lugar — `packages/cli/src/commands/new.ts`; e2e `taskin new --group --priority > a tarefa ja nasce no grupo e com a prioridade`, e as duas recusas **antes** de criar o arquivo
- [x] As mesmas operacoes no servidor MCP — `join_group`, `leave_group`, `set_priority` (`priority` | `before` | `after`) em `packages/task-server-mcp/src/task-server-mcp.ts`; 12 testes em `packages/task-server-mcp/src/agrupar-priorizar.test.ts`, contra um `TaskManager` de verdade
- [x] Recusar com clareza o que nao da para fazer: grupo inexistente, task inexistente, prioridade fora da faixa — a regra mora no dominio (`TaskManager.assignToGroup`/`setPriority`, `validarPrioridade`); testes `recusa um grupo que nao existe, dizendo qual`, `recusa uma tarefa que nao existe`, `recusa prioridade fora da faixa` nas tres camadas (task-manager, MCP, CLI e2e). Faixa: inteiro de 1 a `Number.MAX_SAFE_INTEGER`
- [x] Provider sem grupos nao expoe a operacao, e a CLI diz isso em vez de falhar torto — MCP so anuncia `join_group`/`leave_group` quando ha `groupRegistry` (teste `um provider sem grupos nao anuncia as ferramentas, e recusa em uma frase`); CLI em `packages/cli/src/commands/group.sem-grupos.test.ts`; a frase e uma so, `GROUPS_NOT_SUPPORTED`
- [x] TDD, e documentacao nas quatro frentes — README da raiz, `packages/cli/README.md`, `packages/task-server-mcp/README.md`, `docs/QUICKSTART.md`, `docs/MCP_CLAUDE_SETUP.md`, `docs/MCP_VSCODE_SETUP.md`, e o site em `packages/docs/content/index.md` e `pt-br/index.md`. A guarda `documented-tools.test.ts` passou a enxergar as ferramentas de grupo

### O que ficou decidido, e onde

- **As operacoes ja nasceram no `ITaskManager`** (`assignToGroup`, `removeFromGroup`,
  `setPriority`, `moveBefore`, `moveAfter`), com os nomes da RDT
  `superficies-derivam-do-mesmo-contrato.md`. A CLI e o MCP so as chamam. Fica
  para a task-106 o dashboard passar a usa-las em vez do `update` generico, e o
  portao de compilacao.
- **Relativo reaproveita a numeracao da task-084**: `posicionarPrioridade`
  (`packages/task-manager/src/posicionar-prioridade/`) tira a tarefa, a devolve
  sem numero no ponto pedido e chama `numerarPrioridade`. As sem numero depois
  do ponto ficam fora da passada — teste `nao numera quem esta sem numero depois
  do ponto de insercao`.
- **Achado no caminho**: `numerarPrioridade`, quando nao havia espaco, devolvia a
  mesma tarefa duas vezes (duas gravacoes do mesmo arquivo). Corrigido; teste
  `sem espaco, cada tarefa volta uma vez so`.

### Verificacao

`pnpm lint`, `pnpm typecheck` verdes. `pnpm test`: todos os pacotes verdes,
exceto `design-vue` e `ui-sense`, que precisam do navegador do Playwright
(ausente neste ambiente, e nao tocados aqui). No `taskin`, a suite paralela tem
flake pre-existente — timeouts de 5s e `dubious ownership` no `test-temp-e2e` —
que reproduzi tambem **sem** esta mudanca; rodando em serie
(`pnpm --filter taskin exec vitest run --config vitest.e2e.config.ts`) passam
79/79, e os nao-e2e 319/319.

## Notes

### A lacuna

O `taskin group` cria, lista, renomeia e remove **grupos** — e nao coloca uma
task em nenhum deles. Nao existe comando algum que defina **prioridade**. O
`taskin prioritize` numera o conjunto inteiro de uma vez, que e outra operacao.

No MCP e o mesmo quadro: ha `list_groups` e `prioritize_tasks`, e nada que mova
uma task para um grupo ou lhe de um numero.

Resultado pratico: para agrupar as tasks 103, 068 e 104 neste repositorio,
editei o bloco de metadados dos tres arquivos a mao. Funcionou e o
`pnpm lint:tasks` aprovou, mas e exatamente o que o projeto pede para nao se
fazer — se o proprio taskin nao usa o taskin para isso, a lacuna nao aparece
para mais ninguem.

### As decisoes

**Onde mora a prioridade.** Tres formas plausiveis, e a escolha muda a
ergonomia:

- `taskin priority <task> <n>` — direto, mas cria um comando de uma linha so;
- `taskin group join <task> <grupo> --priority <n>` — junta as duas operacoes
  que quase sempre acontecem juntas, e deixa a prioridade sem casa propria;
- flags num `taskin edit <task>` que ainda nao existe — o mais geral, e o maior.

A inclinacao e o primeiro, com `--priority` tambem no `new`.

**Prioridade relativa, e nao so absoluta.** Na pratica ninguem sabe que numero
quer; sabe que quer isto **antes daquilo**. `--before <task>` e `--after <task>`
resolvem sem obrigar a olhar a lista, e reaproveitam a numeracao por passos que
a task-084 ja trouxe — inclusive a garantia de nao reescrever a lista inteira.

**Provider sem grupos.** A capacidade e opcional (task-079): quem nao a tem nao
a expoe. A CLI precisa dizer isso em uma frase, e nao estourar.

### Onde isto se encaixa

Esta task e o **primeiro passo** da decisao registrada em
`docs/RDT/superficies-derivam-do-mesmo-contrato.md`: ela entrega os comandos que
faltam, e a task-106 leva as operacoes para o `ITaskManager`, de onde as tres
superficies passam a deriva-las. Qualquer ordem serve — feita antes, o codigo
daqui migra para as operacoes nomeadas; feita depois, esta vira quase de graca.

### Por que junto das tres superficies

Vale a regra de sempre: uma capacidade nova chega a CLI, ao servidor MCP e ao
dashboard. O dashboard **ja** sabe agrupar e priorizar — e arrastando la que se
faz hoje. Entao aqui a divergencia esta ao contrario do usual: e a CLI e o MCP
que estao atras, e um agente que fala MCP nao consegue organizar a fila que ele
mesmo executa.
