---
'@opentask/taskin-file-system-provider': patch
'@opentask/taskin-git-utils': patch
'@opentask/taskin-types': patch
'taskin': patch
---

A tag de skip de CI passa a ser `[skip ci]`, e vira configuravel

Os commits que o Taskin escreve sozinho — mudanca de status, arquivo de task —
vinham marcados com `[skip-ci]`, com hifen. Nenhuma plataforma reconhece essa
forma: o GitHub Actions documenta cinco strings e essa nao esta entre elas, o
Bitbucket diz explicitamente que a variante com hifen dispara o pipeline, e o
GitLab so pula com `[skip ci]` ou `[ci skip]`. Na pratica cada `taskin start`,
`pause`, `finish` e `review` rodava a CI inteira do projeto de quem usa,
exatamente o contrario do que a tag prometia.

O padrao agora e `[skip ci]`, a unica forma que as tres plataformas aceitam.

A tag tambem deixou de ser literal espalhada pelo codigo e virou configuracao:

- `taskin init` pergunta qual usar, ou aceita `--ci-skip-tag <tag>`
- `taskin config --ci-skip-tag <tag>` muda depois, e a secao interativa lista
  as formas documentadas
- `none` em qualquer um dos dois grava tag vazia, para quem quer que a CI rode
- uma tag fora da lista e aceita com aviso, nao recusada: Azure DevOps usa
  `***NO_CI***` e um pipeline proprio pode casar o que quiser

O campo e `automation.ciSkipTag` no `.taskin.json`. Quem nao tem o campo recebe
`[skip ci]` pelo default do schema — nao ha migracao a fazer.

De quebra, `taskin config --discord-webhook` e `--notification-events` voltaram
a funcionar. O commander entrega as opcoes em camelCase e o comando lia as
chaves com hifen, entao esses dois flags caiam no modo interativo em vez de no
proprio ramo.
