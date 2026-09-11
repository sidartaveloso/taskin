---
'@opentask/taskin-file-system-provider': patch
---

`lint --fix` passa a juntar o bloco de metadados partido também quando a
marcação já está correta.

O reparo do bloco partido por linha em branco só acontecia se a reemissão
mudasse alguma linha — na prática, se a última linha tivesse a barra invertida
sobrando. Num arquivo cujo bloco terminava num campo sem barra:

```markdown
# Task 024 — algo
Priority: 240\

Status: done\
Type: chore\
Assignee: Sidarta Veloso\
Completed: 2026-04-17
```

as linhas de metadado já batiam com o formato alvo, a comparação dizia "nada a
fazer", e a linha em branco no meio sobrevivia. Achado rodando o `--fix` num
projeto real: 66 de 70 arquivos foram reparados e 4 ficaram para trás,
exatamente os que terminavam num campo sem marcação.

A comparação passa a levar em conta o intervalo inteiro do bloco — linhas em
branco incluídas — e não só as linhas de metadado.
