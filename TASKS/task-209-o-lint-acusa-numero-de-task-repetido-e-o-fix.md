# 🧩 Task 209 — O lint acusa número de task repetido e o --fix renumera a mais nova

- Status: in-progress
- Type: fix
- Assignee: To be defined
- Difficulty: 2

## Description
Dois arquivos com o mesmo número em TASKS/ (ex.: task-027-a.md e task-027-b.md) passam no taskin lint sem aviso, e start/review/finish NNN pegam um deles: no Nexo o review 027 achou a task done e recusou a in-progress. O lint deve acusar como erro; o --fix renumera a mais nova (data do primeiro commit do arquivo) para o próximo número livre e atualiza o título.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O `taskin lint` acusa como **erro** dois ou mais arquivos com o mesmo número, citando os caminhos — `validarNumerosRepetidos` (`numero-repetido/`); evidência: `numero-repetido.test.ts` (2 e 3 arquivos) e `numero-repetido.e2e.test.ts` (sai com 1)
- [x] `start`, `review` e `finish NNN` recusam o número repetido com a mesma mensagem, em vez de pegar um dos arquivos — o `findTask` do provider lança com `mensagemDoNumeroRepetido`, então o `pause` também recusa; evidência: `numero-repetido.e2e.test.ts` (os três comandos saem com 1 e citam os dois caminhos)
- [x] O `lint --fix` renumera os repetidos, menos o mais antigo (data do primeiro commit do arquivo; sem histórico, a do arquivo), para o próximo número livre: nome do arquivo e título — por `git mv`, com nota no fim; o `--follow` atravessa renomes mas para na cópia (toda task nasce do mesmo modelo); no empate fica a que não está `done`; evidência: `renumerarRepetidos` em `numero-repetido.test.ts`, e a própria task-141 repetida deste repositório virou task-211 pelo `--fix`
- [x] O `--fix` acha as referências ao arquivo renomeado e as ajusta: links pelo nome do arquivo (`TASKS/task-027-abrir-portas-...md`, inclusive caminho relativo como `../TASKS/...`) em qualquer arquivo versionado do repositório (`git ls-files`), não só em `TASKS/` — evidência: teste de link absoluto no `README.md` e relativo em `docs/guia.md`, com arquivo não versionado intocado
- [x] Só o que aponta para **aquele** arquivo muda: `task-027` solto no texto continua ambíguo (pode ser a outra) e não é trocado; o `--fix` lista essas menções, com arquivo e linha, para quem decide — inclusive `task-027.md` sem trecho de título, em que só a referência com `.md` muda; evidência: testes de menção solta em `numero-repetido.test.ts`
- [x] O `--fix` mostra o que fez: de → para em cada renumeração, os arquivos ajustados e as menções que ficaram para decidir; branches `feat/task-NNN` e PRs abertos do número antigo também entram na lista, sem serem mexidos — as branches locais e remotas `*/task-NNN*` saem como aviso; PR não é consultado (o lint não fala com o GitHub), a branch remota é a pista dele; evidência: `issuesDaRenumeracao` e o teste de branches
- [x] Feito em TDD: cada item acima começa por um teste que falha (vermelho → verde → refatora), com repositório git de fixture: duplicata de 2 e de 3 arquivos, uma task `in-progress` entre elas, link relativo e absoluto, menção solta, e um segundo `--fix` que não muda nada — commit `test(task-209)` vermelho antes do `feat(task-209)`; 24 testes novos, `pnpm test` verde

## Notes
Achado no Nexo (`devix-tecnologia/nexo`, PR 4): duas `task-027`, uma `done` e outra `in-progress`. O `taskin review 027` achou a `done` e recusou; a saída que a pessoa achou foi apagar o arquivo da outra, o que tira a task do fluxo e perde o registro dela. Lá há também 021, 022 e 028 repetidas, e o `taskin lint` passa sem aviso nenhum (só avisa prioridade repetida, em `validar-priorizacao`).

Renumerar a mais antiga quebraria referências mais velhas; por isso a mais nova muda.
