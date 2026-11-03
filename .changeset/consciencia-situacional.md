---
'@opentask/taskin-situation': minor
'taskin': minor
---

A consciencia situacional, como pacote novo e publicado: `@opentask/taskin-situation`
traz os casos de uso e o sistema como tipos (inventario em duas camadas, sondagem,
acesso as contas de LLM, registro de execucao com a dificuldade estimada e a
encontrada, escalonador com funcao objetivo, canais, pessoas e pedidos de ponto de
vista), a implementacao em memoria, os provedores simulados e as implementacoes
locais, com as suites de contrato no subpath `./testing`. O acesso escolhe a conta
liberada para o dado e a menos ocupada (pelas execucoes em aberto no registro); so a
conta que declara capacidade (`concurrencyLimit`) tem reserva, com prazo e devolucao.
O registro de execucao tem duas metades: o historico do time, versionado e so com o que
calibra (por modelo, sem conta e sem horario), e o estado da maquina, com a conta usada,
o comeco das execucoes e o consumo com horario.
A CLI ganha o `taskin access run|status`, que escolhe a conta e roda o comando com o
segredo so no ambiente dele, e o `taskin status`: a task em andamento no topo, os
recursos e quais tasks abertas rodam nesta maquina, em `--format text|json|html|md`
ou `--json`.
