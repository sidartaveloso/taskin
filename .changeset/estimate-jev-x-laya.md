---
'@opentask/taskin-difficulty-estimator': minor
'taskin': minor
---

`taskin estimate` sugere a dificuldade das tasks perguntando ao Jev (TypeSafe,
hospedado) e ao Laya (local, pelo `laya-serve`), que falam o mesmo
`/v1/systemone`; o layerall chama os dois em `fan_out`. Com `--rinha`, o
rinhany põe os dois, as versões calibradas deles (a nota lida pela posição
contra as notas humanas) e dois pisos (`always-2` e uma heurística), contra as
tasks que já têm nota humana, e salva o placar em `.taskin/rinhas/`. Quem não
roda (sem `TYPESAFE_API_KEY`, `laya-serve` fora do ar) aparece com o motivo, e o
outro ganha por W.O. `--apply` grava a sugestão do vencedor, só se ele bater os
pisos, e nunca por cima de uma nota humana. Pacote novo:
`@opentask/taskin-difficulty-estimator`. A rinha é beta: o placar é uma pista, não
a verdade, e a CLI diz isso ao mostrá-lo.
