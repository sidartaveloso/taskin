---
'@opentask/taskin-file-system-provider': patch
---

`lint --fix` volta a corrigir a grafia do assignee em arquivos no estilo `list`.

O `fixAssignees` reescrevia a linha por `/^(Assignee:[ \t]*)(.*)$/im`, ancorado
no início da linha. Num arquivo no estilo `list` a linha é `- Assignee: ...` e o
padrão nunca casava — então o lint reportava o aviso, sugeria literalmente
"Rewrite it as `<id>` — lint --fix does this", e não tocava em arquivo nenhum.

Um escritor que ficou para trás quando a leitura passou a aceitar os três
estilos de marcação. Agora ele escreve pelo mesmo módulo dos demais, e tira o
rótulo do próprio arquivo: um arquivo em pt-BR diz `Responsável:`, e escrever
`Assignee:` nele criaria um segundo campo em vez de corrigir o primeiro.

## Por que passou despercebido

A fixture do teste de integração era `plain` — o único dos três estilos em que
a regex antiga ainda funcionava. O teste passa a rodar nos três, e afirma
também que o conserto não troca o estilo do arquivo pelo caminho. Verificado
que ele falha no caso `list` sem esta correção.
