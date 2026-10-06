# 🧩 Task 135 — O autoSync publica depois de cada mudanca de status, como o contrato promete

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
O TSDoc de autoSync em packages/cli/src/lib/config-manager.ts promete fetch/rebase/push antes de criar tasks e depois de mudancas de status, mas so a primeira metade existe: o push acontece no taskin new (pushAfterCreate) e no squash do finish quando ha originBranch. start, review e finish com autoCommitStatusChange so comitam, e o review apenas sugere git push origin HEAD. Em projeto autopilot (ex.: o directus-extension-mapgrid, rodado pelo Sandcastle) isso deixa o trabalho integrado sem publicar. Fazer, em TDD, com que toda mudanca de status auto-comitada com autoSync ativo e defaultBranch configurado publique a branch corrente; falha de push avisa e nao desfaz o status. Avaliar a relacao com o hook review.post que este repositorio usa para o mesmo fim, e documentar qual dos dois e o caminho recomendado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste vermelho: `review` com autopilot, `autoSync` e `defaultBranch` publica a branch corrente
- [ ] Idem para `start` e para o commit de status do `finish`
- [ ] Sem `autoSync`, ou sem `defaultBranch`, nenhum push acontece
- [ ] Falha de push avisa e mantem o status e o commit locais
- [ ] Decidir e documentar a relacao com o hook `review.post` (`git push origin HEAD`) usado neste repositorio
- [ ] TSDoc do `autoSync` descreve exatamente o que passa a acontecer

## Notes
Achado ao tentar publicar as rodadas do Sandcastle do mapgrid pelo proprio taskin: com `automation.level: autopilot` e `defaultBranch: develop`, nenhum comando alem do `new` faz push. Enquanto esta task nao existir, o `rodada.ts` do mapgrid publica o `develop` por conta propria, marcado como provisorio.
