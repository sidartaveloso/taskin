---
'taskin': patch
---

A tela de `taskin --help` deixa de esconder quatro comandos.

Ela era uma lista escrita à mão, paralela à que o `index.ts` registra no
commander, e as duas divergiram: mostrava **10 dos 14** comandos. `review`,
`stats`, `export` e `notify` existiam, eram testados, e não apareciam para quem
lia a ajuda — funcionalidade pronta que ninguém descobria.

A lista passa a sair de `program.commands`. Nome, argumentos, aliases, opções e
descrição vêm de onde o comando já os declarou, então a divergência deixa de
ser possível.

## O que continua à mão, e por quê

Os **exemplos** — eles dizem o que vale a pena fazer, não o que é possível, e
ninguém os deriva. Ficam num mapa indexado pelo nome do comando, e a ausência
não esconde ninguém: um comando sem exemplo aparece do mesmo jeito, só sem a
seção.

O ícone deixou de ser mantido à parte: a descrição de cada comando já começa com
um, e o mapa paralelo imprimia os dois (`🎯 taskin init` seguido de
`🎯 Initialize Taskin`).
