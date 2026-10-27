# 🧩 Task 209 — O lint acusa número de task repetido e o --fix renumera a mais nova

- Status: pending
- Type: fix
- Assignee: To be defined
- Difficulty: 2

## Description
Dois arquivos com o mesmo número em TASKS/ (ex.: task-027-a.md e task-027-b.md) passam no taskin lint sem aviso, e start/review/finish NNN pegam um deles: no Nexo o review 027 achou a task done e recusou a in-progress. O lint deve acusar como erro; o --fix renumera a mais nova (data do primeiro commit do arquivo) para o próximo número livre e atualiza o título.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O `taskin lint` acusa como **erro** dois ou mais arquivos com o mesmo número, citando os caminhos
- [ ] `start`, `review` e `finish NNN` recusam o número repetido com a mesma mensagem, em vez de pegar um dos arquivos
- [ ] O `lint --fix` renumera os repetidos, menos o mais antigo (data do primeiro commit do arquivo; sem histórico, a do arquivo), para o próximo número livre: nome do arquivo e título
- [ ] O `--fix` avisa o que renumerou (de → para), porque links e branches `feat/task-NNN` que citem o número antigo ficam para quem decide
- [ ] Testes do lint e do `--fix` com duplicata de 2 e de 3 arquivos, e com uma task `in-progress` entre elas

## Notes
Achado no Nexo (`devix-tecnologia/nexo`, PR 4): duas `task-027`, uma `done` e outra `in-progress`. O `taskin review 027` achou a `done` e recusou; a saída que a pessoa achou foi apagar o arquivo da outra, o que tira a task do fluxo e perde o registro dela. Lá há também 021, 022 e 028 repetidas, e o `taskin lint` passa sem aviso nenhum (só avisa prioridade repetida, em `validar-priorizacao`).

Renumerar a mais antiga quebraria referências mais velhas; por isso a mais nova muda.
