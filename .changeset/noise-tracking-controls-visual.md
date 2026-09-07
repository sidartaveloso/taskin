---
'@opentask/ui-sense': patch
---

`NoiseTrackingControls` ganha a mesma linguagem visual do `TrackingControls`.

O componente usava seis hex fixos (`#1f7acb`, `#fafafa`, `#d32f2f`, `#4caf50`…)
e nenhum dos tokens do proprio pacote. Agora cor, espacamento, raio e tipografia
saem de token, e ele fica visualmente irmao do controle que costuma aparecer ao
lado.

O que estava quebrado de fato:

- o campo `number` do debounce nao tinha largura e esticava sozinho, dominando a
  barra
- o "Threshold" empilhava rotulo, slider e valor em tres linhas dentro de uma
  fila horizontal, desalinhando tudo o que vinha depois
- o valor do slider era impresso cru, entao mudava de largura a cada arrasto e
  empurrava o resto da linha; agora tem tres casas fixas e `tabular-nums`
- o status "Listening for noise..." ficava solto no fim da barra, longe do botao
  que o controla

Os controles passaram a dois grupos (`fieldset`/`legend`) — "Reactions" e
"Sensitivity" —, com as caixas em chips que mudam fundo, borda e peso quando
marcadas, e o status ao lado do botao. O erro segue a mesma decisao de contraste
do irmao: a cor vive na borda, e o texto usa `--text-secondary`, porque todo
token vermelho reprova o AA sobre `--text-error-bg`.

As stories saltaram de uma para quatro, com `Listening`, `WithError` e uma
`Interactive` com pai de verdade e play function cobrindo o botao, o slider e as
caixas.
