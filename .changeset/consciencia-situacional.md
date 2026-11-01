---
'@opentask/taskin-situation': minor
'taskin': minor
---

A consciencia situacional, como pacote novo e publicado: `@opentask/taskin-situation`
traz os casos de uso e o sistema como tipos (inventario em duas camadas, sondagem,
emprestimo de credenciais, registro de execucao com a dificuldade estimada e a
encontrada, escalonador com funcao objetivo, canais, pessoas e pedidos de ponto de
vista), a implementacao em memoria, os provedores simulados e as implementacoes
locais, com as suites de contrato no subpath `./testing`. A CLI ganha o
`taskin status`: a task em andamento no topo, os recursos e quais tasks abertas
rodam nesta maquina, em `--format text|json|html|md` ou `--json`.
