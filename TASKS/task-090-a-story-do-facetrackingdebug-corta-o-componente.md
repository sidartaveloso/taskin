# 🧩 Task 090 — A story do FaceTrackingDebug corta o componente: ele e um overlay sem superficie

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Priority: 11751

## Description
Na galeria, a story do FaceTrackingDebug aparece cortada: o painel de debug fica pela metade dentro do canvas. O componente e position absolute, pensado para ficar sobre a imagem da camera; renderizado solto, ele sai do fluxo, o container colapsa e o conteudo transborda. A story precisa dar a ele a superficie posicionada que ele espera. Aproveitar para expor a lista de humores do Taskin em tempo de execucao, hoje copiada a mao na story AllMoods.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Entender o corte: o painel e `position: absolute` e a story nao lhe dava ancestral posicionado nem altura
- [x] Desenhar toda story dentro de uma superficie do tamanho de um quadro de webcam (`emUmaSuperficie`)
- [x] Explicar na descricao da story que a moldura e contexto, nao enfeite
- [x] Dizer na story `NoData` que o que some e o painel, nao a story
- [x] Expor `TASKIN_MOODS` em tempo de execucao e derivar `TaskinMood` dela
- [x] Trocar as duas copias a mao da lista de humores na `Taskin.stories.ts` pela lista exportada
- [x] Verificacao do repositorio: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### O corte

Na galeria o painel de debug aparecia pela metade, cortado pela borda do canvas.
Ele e `position: absolute` — foi desenhado para ficar **sobre** a imagem da
camera, ancorado num canto dela. Renderizado solto, sai do fluxo, o container da
story colapsa para altura zero, e o que sobra transborda o canvas.

Nao era defeito do componente: era a story pedindo a ele que se posicionasse em
relacao a nada. Todas as quatro passaram a desenha-lo dentro de uma superficie
posicionada de 480x360, com o texto "imagem da camera" ao fundo, para ficar
evidente sobre o que o painel flutua.

### A lista de humores

A `Taskin.stories.ts` tinha a lista dos dezessete humores escrita a mao **duas
vezes** — nas `options` do controle e no `data()` da story `AllMoods` — e o mural
da landing seria a terceira copia. Um humor novo no SVG envelheceria as tres em
silencio.

Agora `TASKIN_MOODS` e um valor exportado pelo design system e `TaskinMood`
deriva dele (`(typeof TASKIN_MOODS)[number]`), entao a lista e o tipo nao podem
divergir.

### Evidencia

- `packages/design-vue/src/components/organisms/taskin/Taskin.moods.spec.ts` —
  20 testes: a lista nao repete humor, comeca pelo `neutral`, deriva o tipo, e
  **cada um dos dezessete** monta o componente e desenha a boca.
- `pnpm test` verde nas 42 tarefas do turbo.
