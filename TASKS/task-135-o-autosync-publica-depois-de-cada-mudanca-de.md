# 🧩 Task 135 — O autoSync publica depois de cada mudanca de status, como o contrato promete

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
O TSDoc de autoSync em packages/cli/src/lib/config-manager.ts promete fetch/rebase/push antes de criar tasks e depois de mudancas de status, mas so a primeira metade existe: o push acontece no taskin new (pushAfterCreate) e no squash do finish quando ha originBranch. start, review e finish com autoCommitStatusChange so comitam, e o review apenas sugere git push origin HEAD. Em projeto autopilot (ex.: o directus-extension-mapgrid, rodado pelo Sandcastle) isso deixa o trabalho integrado sem publicar. Fazer, em TDD, com que toda mudanca de status auto-comitada com autoSync ativo e defaultBranch configurado publique a branch corrente; falha de push avisa e nao desfaz o status. Avaliar a relacao com o hook review.post que este repositorio usa para o mesmo fim, e documentar qual dos dois e o caminho recomendado.

## Design
A `defaultBranch` do remoto e o quadro de status compartilhado: quem roda `taskin new` ou `list` em qualquer clone ou worktree ve a situacao atual de cada task sem esperar merge de feature. Contrato do autopilot com `autoSync` e `defaultBranch`:

1. Todo commit de status (`start`, `review`, `finish`, e a porta MCP) vai para a `defaultBranch` **e e publicado**.
2. **Sem checkout.** O desvio atual (stash, `git checkout develop`, commit, volta) quebra em worktree, porque o git nao abre a mesma branch em duas worktrees, e o `catch` devolve `false` sem dizer por que. O novo `GitService.publishTaskStatusChange(taskId, status, defaultBranch)` monta o commit com plumbing (`fetch`, `hash-object`, `mktree`/indice temporario, `commit-tree` sobre `origin/<defaultBranch>`) e empurra o sha direto: `git push origin <sha>:refs/heads/<defaultBranch>`. Nao toca em HEAD, no indice, na arvore de trabalho, no stash nem no `develop` local.
3. O commit leva so o arquivo da task (e `TASKS/assets/task-<id>/`, se houver), com a tag de skip de CI.
4. Corrida entre rodadas: non-fast-forward refaz fetch e reconstroi o commit sobre o novo `origin/<defaultBranch>`, ate 3 tentativas (mesmo limite do `pushAfterCreate`).
5. Falha de push (ou de fetch) devolve `{ published: false, reason }`, o comando avisa e o status local permanece.
6. A `defaultBranch` e a fonte da verdade do status: o arquivo da task na branch da feature pode ficar defasado. Documentar que branches de feature nao devem commitar o arquivo da task e que um merge nao deve reverter o status.
7. `review.post` (`git push origin HEAD`) publica a branch de trabalho, nao o status; deixa de ser o caminho recomendado para o status e segue valido para publicar o trabalho.

Tradeoff aceito: cada mudanca de status vira um commit `docs(TASKS)` na `defaultBranch`; a tag de skip de CI evita pipeline.

Teste de contrato (vermelho, escrito primeiro): `packages/git-utils/src/git-service.publish-status.integration.test.ts`, com remoto bare, checkout principal em `develop` e a rodada numa worktree.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Teste vermelho do contrato de `publishTaskStatusChange` (git-utils, worktree + remoto bare): publica, sem checkout/stash, so o arquivo da task, preserva trabalho local, sobrevive a non-fast-forward, falha de push avisa
- [x] Implementar `publishTaskStatusChange` sem checkout (verde) e declarar em `IGitService` (feito junto da task-204)
- [ ] Teste vermelho: `review` com autopilot, `autoSync` e `defaultBranch` publica o status na `defaultBranch`
- [ ] Idem para `start`, para o commit de status do `finish` e para a porta MCP (`mcp-status-hook`)
- [ ] Sem `autoSync`, ou sem `defaultBranch`, nenhum push acontece
- [ ] Falha de push avisa e mantem o status e o commit locais; o aviso diz o motivo
- [ ] Trocar o desvio por checkout (`commitTaskStatusChangeOnBranch`) pelo novo metodo nos comandos, ou removê-lo se ficar sem uso
- [ ] Documentar a relacao com o hook `review.post` (`git push origin HEAD`) e a regra de fonte da verdade do status
- [ ] TSDoc do `autoSync` descreve exatamente o que passa a acontecer

## Notes
Achado ao tentar publicar as rodadas do Sandcastle do mapgrid pelo proprio taskin: com `automation.level: autopilot` e `defaultBranch: develop`, nenhum comando alem do `new` faz push. Enquanto esta task nao existir, o `rodada.ts` do mapgrid publica o `develop` por conta propria, marcado como provisorio.
