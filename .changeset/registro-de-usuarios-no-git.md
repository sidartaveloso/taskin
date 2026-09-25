---
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

A migração do registro de usuários da 3.x deixa de terminar num commit que remove o registro sem pôr nada no lugar.

Com o arquivo antigo na raiz **e** o canônico em `.taskin/`, o `taskin lint --fix` usava `git mv`
para levar o da raiz a `.taskin/.taskin-users.legacy.json` — preservando o histórico de um arquivo
que o passo seguinte mandava apagar — e o canônico, que é o que se lê, continuava fora do Git.

Agora o estacionado sai da raiz por rename comum e fica fora do índice; o que vai para o índice é a
remoção do arquivo da raiz junto com a adição do canônico, no mesmo commit, que é onde o Git infere
o rename. O informativo do estacionado diz o que fazer com o Git, e o `taskin lint` avisa quando o
registro canônico existe mas não está versionado. Projeto sem Git e registro excluído pelo
`.gitignore` seguem funcionando, sem aviso. Guia em `docs/UPGRADE.md`.
