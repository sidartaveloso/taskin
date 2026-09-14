# 🧩 Task 083 — O pnpm build nao regenera o dashboard que o CLI serve: dashboard-dist fora dos outputs do turbo

- Status: in-progress
- Type: fix
- Priority: 252
- Assignee: Sidarta Veloso

## Description
O comando dashboard serve packages/cli/dashboard-dist, produzido por build:dashboard. Esse diretorio nao esta nos outputs declarados do turbo, entao um acerto de cache restaura o dist e deixa o dashboard-dist velho no lugar.

## Tasks
- [x] Reproduzir: mexer num `.vue` ou num composable, rodar `pnpm build`, e conferir a data do bundle servido
- [x] Declarar `dashboard-dist/**` nos outputs do build do `taskin`
- [x] Conferir se `.vue` entra nos `inputs` — hoje o padrao e `src/**/*.{ts,js,tsx,jsx}`
- [x] Guarda que pegue a proxima ocorrencia

### O que comprova cada item

**A reproducao** esta registrada na task-082: bundle servido de `10:21`, fonte de
`18:32`, e o clique alterando 499 arquivos. Depois de reconstruir a mao, 1.

**As duas correcoes no `turbo.json`**, na tarefa base `build`:

| | antes | depois |
| --- | --- | --- |
| `outputs` | sem `dashboard-dist` | `dashboard-dist/**` incluido |
| `inputs` | `src/**/*.{ts,js,tsx,jsx}` | `...,vue}` |

O `.vue` faltando era o segundo buraco: mudanca em componente nao invalidava o
cache.

**A guarda:** `packages/cli/src/dashboard-bundle.test.ts` compara a data do
bundle servido com a do fonte mais novo de `dashboard` e `design-vue`, e falha
dizendo o que rodar. Verificada nos dois sentidos — passa com o bundle em dia, e
com um `touch` no fonte:

```
→ O bundle servido (2026-09-14T21:40:52Z) e mais antigo que
  .../use-prioritization.ts. Rode `pnpm --filter taskin run build:dashboard`.
```

Ela se cala quando ainda nao ha build, para nao falhar antes do `build:dashboard`
rodar.

## Notes

**Como apareceu, e o quanto custou.** Ao medir o conserto da task-082 com 500
tarefas, o dashboard reescreveu **499 arquivos** — exatamente o defeito que eu
acabara de consertar. Quase registrei "o conserto nao funciona em escala".

O que salvou foi comparar relogios:

```
fonte alterado:  Sep 14 18:32
bundle servido:  Sep 14 10:21
```

Oito horas de diferenca. Eu estava medindo o codigo antigo. Depois de rodar
`pnpm run build:dashboard` a mao, o mesmo clique alterou **1** arquivo.

**A causa.** O `taskin dashboard` serve `packages/cli/dashboard-dist`
(`dashboard.ts:288`), produzido pelo script `build:dashboard`, que compila o app
e copia para la. Mas a tarefa `build` do turbo declara

```
outputs: ["dist/**", "build/**", "generated/**", "content/.vitepress/dist/**"]
```

e **`dashboard-dist/**` nao esta ali**. Num acerto de cache o turbo restaura o
`dist/` e deixa o `dashboard-dist/` como estava — com o bundle de horas atras.

Vale conferir tambem os `inputs`: o padrao e `src/**/*.{ts,js,tsx,jsx}`, que
**nao inclui `.vue`**. Mudanca em componente pode nao invalidar o cache.

**Por que isso e pior que um build lento.** Um artefato velho servido em silencio
nao parece defeito de build — parece defeito do codigo que voce acabou de
escrever. O tempo se perde investigando o lugar errado, e a conclusao errada pode
virar commit.

**A guarda.** O padrao ja se repetiu nesta sessao (`dist` incompleto fazendo o
typecheck falhar por ordem). Vale um teste ou um passo que compare a data do
bundle servido com a do fonte mais novo dos pacotes que o compoem, e falhe quando
o servido for mais antigo.
