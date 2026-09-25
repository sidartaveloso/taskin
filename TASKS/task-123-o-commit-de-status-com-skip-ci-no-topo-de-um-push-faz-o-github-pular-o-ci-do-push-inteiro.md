# 🧩 Task 123 — O commit de status com [skip ci] no topo de um push faz o GitHub pular o CI do push inteiro

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Priority: 300
- Difficulty: 2

## Description
Um push de 31 commits para origin/develop nao disparou nenhum workflow, porque o commit do topo era o de status que o taskin finish grava com [skip ci], e o GitHub le so o commit do topo. Foi preciso disparar a verificacao e o build do Pages a mao com gh workflow run. Toda rodada do sandcastle termina com um commit de status no topo, e o docs/SANDCASTLE_LICOES.md ja descreve o risco. Decidir como o taskin evita isso: nao marcar o commit de status quando ha commits de trabalho ainda nao enviados abaixo dele, avisar no push, ou outra saida.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Reproduzir em teste: o commit de status e o topo depois de commits de trabalho nao enviados
- [ ] Decidir a saida: nao marcar com a tag o commit de status que fica em cima de trabalho nao enviado; ou marcar e avisar no push; ou fazer o sync publicar o trabalho antes do status
- [ ] A regra vale para o commit de status da CLI e do `finish_task` do MCP
- [ ] Atualizar `docs/SANDCASTLE_LICOES.md` ("O commit de status pode suprimir o seu CI") com a solucao
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

Em 2026-09-24 o push dos 31 commits de grupos aninhados, operacoes nomeadas e
listagem por padrao so foi verificado porque se notou a falta da execucao e se
disparou `gh workflow run ci.yml --ref develop` a mao.

### Ocorrencias em 2026-09-25, no release da 5.0.0

O workflow `Release` so dispara por push na `main`, sem `workflow_dispatch`. Com
um commit de status no topo, o push da `main` pularia o Release e o PR de
versao nao seria atualizado. Duas vezes no mesmo dia foi preciso deixar no topo
um commit de evidencia sem a tag (nas tasks 100 e nesta) antes de avancar a
`main`. Contornar a mao funciona, mas depende de alguem lembrar — e o caso que
esta task tem que resolver.
