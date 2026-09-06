---
'@opentask/ui-sense': patch
---

Poe o `TrackingControls` na paleta do proprio pacote e agrupa os controles.

O componente usava hex fixos (`#1f7acb`, `#f5f5f5`, `#d32f2f`, `#4caf50`) e
ignorava os 99 tokens de `src/styles/variables.css` — `#1f7acb` esta perto, mas
nao e, o `--status-progress-bg`. Agora cor, espacamento, raio e tipografia saem
todos de token.

Visualmente: os seis checkboxes eram uma fila unica de caixas nativas de 13px,
com a acao primaria e o status soltos na mesma linha. Passaram a ser dois grupos
(`fieldset`/`legend`) — "Exibicao" e "Sincronizar" —, com os itens em chips que
mudam fundo, borda e peso quando marcados, e o botao com o status ao lado, ja
que o status descreve o botao. O agrupamento tambem da contexto de grupo a quem
usa leitor de tela.

Contraste, medido: o vermelho de erro anterior (`#d32f2f` sobre `#ffebee`) dava
4.36 e reprovava o AA, e todos os tokens vermelhos reprovam nesse fundo. O texto
passou a usar `--text-secondary` (11.96) e a cor vive na borda e no ponto — a
leitura deixa de depender dela. Mesma decisao no status: `--text-success` da
3.62 sobre o fundo claro, entao o verde ficou so no indicador.

Junto: anel de `:focus-visible` no botao e nos chips, e `prefers-reduced-motion`
desligando a pulsacao e as transicoes. O `.storybook/preview.css` do pacote passa
a importar `variables.css` — sem isso as stories renderizariam com `var(--...)`
sem valor, que e a razao de o componente nunca ter usado token.

Os rotulos dos itens perderam o verbo repetido: cinco chips dizendo
"Sincronizar X" sob uma legenda que ja diz SINCRONIZAR viraram "Olhos", "Boca",
"Expressoes", "Bracos" e "Gestos", e "Mostrar Webcam" virou "Webcam" sob
EXIBICAO. O nome acessivel encurta junto, o que e correto: o leitor de tela
anuncia "Sincronizar, grupo" antes de cada item, entao o verbo estava sendo dito
duas vezes.

Sem mudanca de API, de classes ou da ordem dos checkboxes: as 9 asercoes do spec
e as 8 stories seguem passando.
