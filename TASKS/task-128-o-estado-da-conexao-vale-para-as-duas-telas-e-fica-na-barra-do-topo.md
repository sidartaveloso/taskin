# 🧩 Task 128 — O estado da conexao vale para as duas telas, e fica na barra do topo

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Priority: 775

## Description
O indicador de conexao (Connected, o botao de tentar de novo e a faixa de erro) so aparece no Board, dentro do cabecalho do DashboardHeader. A conexao e a do WebSocket com o servidor, e a Prioritization depende dela tanto quanto o Board, porque grava pelo servidor a cada movimento: quem esta la nao ve quando cai. O estado sai do cabecalho do Board para a barra do topo que a task-127 criou, comum as duas telas, numa molecula ConnectionStatus que o DashboardHeader tambem usa.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Molecula `ConnectionStatus` em `packages/design-vue/src/components/molecules/ConnectionStatus.vue` (indicador, texto, botao de tentar de novo, `role="status"`, pulso desligado com `prefers-reduced-motion`), exportada pelo pacote e com story em `Molecules/Task/ConnectionStatus`. Testes: 6 em `ConnectionStatus.spec.ts`
- [x] O `DashboardHeader` usa a molecula, com a mesma API de antes (os 7 testes antigos de `DashboardHeader.spec.ts` passam sem mudanca), e ganha `showConnection`, repassada por `DashboardLayout` e `Dashboard`. Teste `hides the connection status and the error banner when showConnection is false`
- [x] O dashboard mostra a conexao na barra do topo nas duas telas, e a faixa de erro logo abaixo (`packages/dashboard/src/App.vue`). Testes em `App.spec.ts`: `na tela board, a conexao aparece na barra do topo`, `na tela prioritization, ...`, `o Board nao repete a conexao no proprio cabecalho`, `um erro de conexao aparece abaixo da barra nas duas telas`
- [x] No navegador, dashboard do `.bench500`: `Connected` na barra do topo no Board e na Prioritization, e o cabecalho do Board sem o indicador. Parando o servidor com a Prioritization aberta, o topo passou a `Connecting...` e depois `Connection error` com `Tentar novamente`, e a faixa mostrou `WebSocket connection error`
- [x] Changeset em `.changeset/conexao-nas-duas-telas.md` (minor no design-vue, pela molecula e pela prop nova)
- [x] Verificacao: `pnpm typecheck`, `pnpm lint`, `pnpm test` (44/44) e `biome check .` verdes

## Notes

### Por que a conexao e da barra, e nao de uma tela

Ha uma conexao so, a do WebSocket. O Board le por ela; a Prioritization le e
grava por ela a cada movimento desde a task-118. Deixar o estado so no Board
escondia a queda justamente de quem mais depende da conexao.
