# 🧩 Task 251 — O list e o new enxergam as tasks das outras worktrees e da branch padrão, sem rede fora do autoSync

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
O list e o new leem so a pasta TASKS da worktree atual: uma task criada na develop por outra worktree nao aparece, e duas worktrees podem gerar o mesmo numero. Passam a ler tambem as outras worktrees locais (git worktree list) e as refs locais da defaultBranch (develop e origin/develop, com ls-tree), sem rede. Com autoSync ligado, um git fetch vem antes. O list mostra de onde veio cada task e avisa quando o status diverge; o new numera pelo maior id entre todas as fontes.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste vermelho (git-utils, git de verdade com worktrees e remoto bare): `listLocalTaskSources` le a pasta TASKS de cada worktree local, inclusive arquivo nao commitado, e as refs locais `<defaultBranch>` e `origin/<defaultBranch>` com `ls-tree`, sem `fetch`
- [ ] Com `fetch: true` (autoSync), um `git fetch origin <defaultBranch>` vem antes; falha de rede avisa e segue com o que ha localmente
- [ ] Fora de um repositorio git, ou sem `defaultBranch`, devolve so o que da para ler sem quebrar
- [ ] `createTask` aceita os ids conhecidos de outras fontes e numera pelo maior; teste no provider
- [ ] `taskin new` passa os ids das fontes locais; teste do comando
- [ ] `taskin list` inclui as tasks que so existem em outra fonte, com a origem, e avisa quando a mesma task tem status diferente entre as fontes (a `defaultBranch` vence); `--json` leva `source`

## Notes
Pedido de Sidarta em 15/11/2026: a task-048 do sidartaveloso foi criada na worktree da develop e nao aparecia na worktree da feature. A task-135 publica o status na `defaultBranch`, mas o `list` (`getAllTasks`) so le a pasta local, entao o que o README promete em "Status from a worktree" nao acontecia.

**Sem rede por padrao.** Decisao de Sidarta: o taskin nao passa a exigir internet. Sem `autoSync`, so worktrees locais e refs que ja estao na maquina (`origin/<defaultBranch>` como ficou no ultimo fetch). Com `autoSync`, faz o `fetch` antes.

Relacionadas: task-109 (sync do `new` fora da `defaultBranch`, pendente) e task-135.
