# 🧩 Task 127 — O topo do dashboard numa linha so, e a tela escolhida na URL como o filtro

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Priority: 750

## Description
O topo do dashboard gasta duas barras inteiras: uma com Board e Prioritization, outra com Open, Active, Closed, All e o Showing N of M. Juntar as duas numa linha so, que quebra em telas estreitas. E a escolha entre Board e Prioritization vive so na memoria: recarregar a pagina volta para o Board, e um link nao leva a priorizacao. Guardar a tela no query param, como o filtro ja e guardado (?view=prioritization, ao lado de ?filter=).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Uma barra so com as telas, o filtro e a contagem — `.top-bar` em `packages/dashboard/src/App.vue`, que quebra em tela estreita. Teste `as telas, o filtro e a contagem ficam na mesma barra` em `packages/dashboard/src/App.spec.ts`. Medido no dashboard do `.bench500`: a barra tem 40px de altura no desktop, onde antes eram duas barras; no celular (375px) quebra em tres linhas sem rolagem horizontal (`scrollWidth` 375)
- [x] A tela escolhida na URL: `?view=board|prioritization`, lida ao abrir (`telaDaUrl`) e gravada ao trocar (`escolherTela`), sem entrada nova no historico. Testes `sem ?view=, abre o Board`, `?view=prioritization abre direto a priorizacao`, `um valor desconhecido em ?view= cai no Board`. No navegador: clicar em Prioritization pos `?view=prioritization` na URL, e recarregar manteve a tela
- [x] Um parametro nao apaga o outro: `gravarNaUrl` mexe so na chave que muda. Testes `trocar de tela grava ?view=, sem perder o ?filter=` e `trocar o filtro nao perde a tela escolhida`. No navegador a URL ficou `?view=prioritization&filter=closed`
- [x] Changeset em `.changeset/topo-do-dashboard-numa-linha.md` (patch no dashboard e na CLI, que o embute)
- [x] Verificacao: `pnpm typecheck`, `pnpm lint`, `pnpm test` (44/44 tarefas do turbo) e `biome check .` verdes

## Notes

### O que ficou de fora

A barra do titulo do Board ("Taskin Dashboard" e o estado da conexao) continua
sendo uma linha propria. Ela e o lugar do nome do projeto e da versao que a
task-121 vai acrescentar, e por isso nao entrou nesta.

### Documentacao

Nenhum guia descrevia as duas barras nem o `?filter=`; o comportamento esta nos
comentarios do `App.vue` e no changeset.
