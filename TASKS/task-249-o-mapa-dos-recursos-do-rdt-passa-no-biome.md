# 🧩 Task 249 — O mapa dos recursos do RDT passa no biome: elementos semanticos no lugar dos roles

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
A pagina docs/RDT/consciencia-situacional-mapa.html deixa o pnpm lint e o CI do develop vermelhos com 70 diagnosticos do biome: role=table, row, cell e columnheader em div e span, role=group em div, role=tablist em ol, JS inline com concatenacao e function, e CSS com especificidade decrescente. A pagina passa a usar table, fieldset e abas com button, com a mesma aparencia, e o lint volta a passar.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O plano por frente vira `<table>` de verdade (`thead`, `th scope`, `colspan`) no lugar de `div`/`span` com `role=table|row|cell`; `border-spacing` faz o papel do `gap`, e a altura dos blocos acompanha a linha — evidência: posições e tamanhos de todos os blocos, nomes e eixo medidos no navegador, idênticos aos de antes
- [x] O filtro do catálogo vira `<fieldset>` (era `div role=group`), a legenda vira `<ul>` (o `aria-label` não valia em `div`) e as abas da jornada ficam filhas diretas de um `div role=tablist` (era `ol`), com o painel rotulado pela aba ativa — evidência: filtro, clique e setas testados no navegador
- [x] JS inline com `const`, arrow functions e template strings; CSS sem `!important` e sem especificidade decrescente (as cores do nome da frente ganham classes próprias)
- [x] Sem rolagem lateral na página em 375px; a tabela rola dentro da caixa, como antes
- [x] Verificação: `pnpm biome check` da página sem diagnóstico; `pnpm lint` da raiz verde

## Notes
O `pnpm lint` e o CI do develop estavam vermelhos desde o merge dos lotes 6 a 9, só por esta página; isso travava o `taskin review` e o release. Achado durante a task-248.
