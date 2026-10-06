# 🧩 Task 130 — O quadro vazio culpa a conexao quando quem esvaziou a lista foi o filtro

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 793

## Description
Com um recorte sem nenhuma task (Active no .bench500, ou Closed num projeto sem tasks fechadas), o Board mostra Nenhuma tarefa encontrada e Conecte-se ao servidor para visualizar suas tarefas, com a conexao verde no topo. A mensagem do estado vazio (TaskGrid/Dashboard em packages/design-vue) tem que distinguir sem conexao, projeto sem tasks, e nenhuma task no recorte atual, e neste ultimo caso dizer qual recorte e como ve-las (All, limpar a busca). O idioma segue o da barra do topo.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Tres estados vazios distintos: sem conexao, projeto sem nenhuma task, e nenhuma task no recorte atual
- [ ] No recorte vazio, dizer qual e o recorte (status, busca, pontuacao) e oferecer o caminho: `All`, limpar a busca
- [ ] O mesmo na tela de priorizacao, que hoje diz `No tasks found.`
- [ ] Idioma: o da barra do topo, que e ingles
- [ ] TDD no componente do estado vazio e no `App.spec.ts`
- [ ] Verificar no dashboard aberto com o `.bench500` (`Active` e `Closed` sao recortes vazios la)
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

Achado na verificacao da task-129.
