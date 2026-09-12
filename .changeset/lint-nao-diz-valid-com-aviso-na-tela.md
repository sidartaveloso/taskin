---
'taskin': patch
---

A linha de fecho do `lint` deixa de dizer "All task files are valid!" logo
abaixo de uma lista de avisos.

No código, `valid` significa **zero erros** — aviso não invalida arquivo, e isso
é deliberado. Mas na tela as duas coisas se contradiziam:

```
⚠ task-013: Task file should have a description section
⚠ task-014: Task file should have a description section
... mais três

✅ All task files are valid!
```

Quem lê não tem como saber que as duas frases convivem por definição.

Com pendência na tela, a linha passa a dizê-la:

```
✅ No errors — 5 warning(s) and 1 info above, listed for a human to decide.
```

Sem pendência nenhuma, a mensagem antiga continua igual. O código de saída não
muda: aviso nunca fez o comando falhar e continua não fazendo.

## Um teste que passava por acidente

A asserção do e2e era `expect(stdout).toContain('valid')` — casava com a frase
inteira e também com a palavra dentro de qualquer outra. Passou a afirmar o que
importa: que não há erro.
