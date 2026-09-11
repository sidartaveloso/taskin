---
'@opentask/taskin-file-system-provider': patch
---

O bloco de metadados volta a ser lido inteiro quando uma linha em branco o
parte no meio.

O `setInlineField` até a 4.0.0 inseria um campo novo logo **depois do H1**, antes
da linha em branco que separava do bloco real. Um arquivo que tenha sido
priorizado por aquela versão fica assim:

```markdown
# 🧩 Task 001 — Alvo
Priority: 10\

Status: pending\
Type: feat\
Assignee: sidarta-veloso\
```

A 3.2.0 encerrava o bloco na primeira linha em branco, então enxergava só o
`Priority`. As consequências eram silenciosas e sérias:

- `Status`, `Type` e `Assignee` liam `undefined` — a task caía para `pending` e
  `feat` por default, e o assignee virava usuário temporário fabricado;
- reescrever o status **criava um segundo campo** em vez de atualizar o
  primeiro, deixando dois `Status:` no arquivo.

Agora a varredura atravessa linhas em branco e para na primeira linha que não é
metadado. As linhas em branco internas caem no intervalo do bloco e somem
quando ele é reemitido — ou seja, a primeira escrita **repara** o arquivo,
juntando tudo num bloco só, no estilo que ele já usava.

## Rótulo precisa começar com letra ou dígito

Para atravessar linha em branco sem engolir o que vem depois, o padrão ficou
mais estrito: `**Date**: 2026-01-08` e `> **Nota (registro histórico):` não são
mais reconhecidos como campo. As duas formas existem em arquivos reais, e antes
seriam reescritas como `- **Date**: ...`.

Campos de rótulo comum continuam valendo, inclusive os ad hoc com espaço
(`Epic`, `Depends on`) e os localizados (`Responsável`, `Dificuldade`).
