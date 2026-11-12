---
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

O `taskin lint --fix`, ao renumerar a task de número repetido, passa a ajustar
as referências ao arquivo renomeado também nos arquivos ainda não versionados
que o `.gitignore` não exclui. Antes, só os arquivos do `git ls-files` eram
ajustados: uma task nova, fora do git, que linkava a renumerada ficava com o
link quebrado e sem aviso. O que o git ignora (`node_modules`, `dist`) continua
de fora.
