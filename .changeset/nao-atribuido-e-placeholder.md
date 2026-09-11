---
'@opentask/taskin-file-system-provider': patch
---

`não atribuído`, `nao atribuido` e `unassigned` passam a contar como "ninguém
ainda", e não como uma pessoa.

A lista de placeholders reconhecia `a definir`, `to be defined`, `nome do
responsável`, `tbd` e `-`. Um assignee fora dela vira **usuário temporário
fabricado**: aparece com o nome certo na tela, sem e-mail e sem avatar, e conta
como pessoa separada nas métricas — que é o mesmo defeito que a validação de
identidade existe para evitar.

Achado num projeto real, onde quatro tasks usavam `não atribuído` e contavam
como um contribuidor. A forma sem acento entra junto porque as duas convivem em
arquivo escrito à mão.
