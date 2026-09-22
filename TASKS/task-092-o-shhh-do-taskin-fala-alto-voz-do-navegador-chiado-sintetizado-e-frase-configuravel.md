# 🧩 Task 092 — O Shhh do Taskin fala alto: voz do navegador, chiado sintetizado e frase configuravel

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description
O TaskinWithShhh reage a barulho com um balao escrito shh mas nao emite som nenhum: a opcao sound existe e o codigo tem um comentario dizendo que nao ha asset de audio, ou seja, um interruptor inerte. O caso de uso e concreto: o Taskin roda no celular com a tela ligada na frente do programador e, quando alguem fala alto na sala, ele pede silencio no lugar da pessoa. Para isso precisa sair som que a sala inteira ouca. Implementar a voz com o SpeechSynthesis do navegador para a frase, o chiado shhhh em si com Web Audio, e tornar a frase configuravel por prop e por .taskin.json, de modo que de para deixar uma story com Bruno, Shhhhhhhhhhhh...

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `phrase` e `volume` no `mascot.reactions.noise` do `.taskin.json`, com defaults e validacao
- [x] A voz: `speechSynthesis` para a frase e chiado sintetizado com Web Audio para o "shhhh"
- [x] A duracao do chiado acompanha os `h` da frase, com piso e teto
- [x] Props `shhhPhrase` e `shhhVolume` no `TaskinWithShhh`, e o balao mostrando a frase
- [x] Story `BrunoShhh` com "Bruno, Shhhhhhhhhhhh..."
- [x] Corrigir o `Taskin`, que recebia `showThoughtBubble`/`thoughtBubbleText` e ignorava os dois
- [x] `MascotConfigInput` para a prop `mascot`, que exigia campos que o schema preenche
- [x] Documentacao: `docs/ARCHITECTURE.md` e o guia `MASCOT_NOISE_REACTION.md`
- [x] Changeset
- [ ] Arquivo de audio baixado da internet — adiado: o chiado e sintetizado, entao nao ha o que baixar, licenciar nem versionar

## Notes

### O que existia

O `TaskinWithShhh` reagia a barulho mostrando um balao, e tinha uma opcao
`sound`. Dentro do codigo, o que ela fazia era isto:

```ts
if (noiseSoundRef.value) {
  // no sound asset presently
}
```

Um interruptor inerte. E o balao nem mostrava "shh": mostrava `?`, porque o
`Taskin` ignorava as props de balao e so o humor `thoughtful` tinha um, com texto
fixo.

### Como ficou

Com `sound: true` saem duas camadas, e a segunda nunca falta:

- **a fala**, pelo `speechSynthesis` do proprio navegador, que diz a frase
  inteira — e por isso que da para dirigir o pedido a alguem;
- **o chiado**, sintetizado com Web Audio: ruido branco por um filtro de banda
  alta em 6kHz, com envelope curto nas pontas para nao estalar.

A duracao do chiado conta os `h` da frase, 90ms cada, entre 400ms e 3s: quem
escreve `Shhhhhhhhhhhh...` esta pedindo mais silencio que quem escreve `Shh`, e
o som obedece.

### Por que nao ha arquivo de audio

A tarefa pedia obter o som da internet. Uma sibilante **e** ruido de banda alta,
entao sintetiza-la sai mais barato do que baixa-la: nenhum arquivo para
licenciar num repositorio publico, nenhum byte no pacote, funciona sem rede, e a
duracao e o volume ficam sob controle em vez de fixos no arquivo. Se ainda assim
um `.mp3` de acervo for preferivel, trocar e pequeno — o ponto de extensao ja
esta isolado em `createShhhVoice`.

### O que o navegador impoe

Audio so toca depois de um gesto do usuario na pagina. Antes disso o balao
aparece e o som nao: e politica do navegador, nao defeito. A voz tambem cancela
a fala anterior — dois pedidos de silencio sobrepostos viram ruido, que e o
oposto do que se quer.

### Evidencia

- `packages/ui-sense/src/utils/shhh-voice.spec.ts` — 9 testes: a regra de
  duracao, o chiado sem voz disponivel, o volume nos dois canais, e a recusa do
  audio pelo navegador nao derrubando quem chamou.
- `packages/design-vue/src/components/organisms/taskin/TaskinWithShhh.spec.ts` —
  quatro testes novos: a frase no balao, a voz chamada com frase e volume, o
  silencio com `sound: false`, e a frase vinda do bloco `mascot`.
- `packages/types-ts/src/taskin.schemas.test.ts` — 123 testes, entre eles a
  recusa de frase vazia e de volume fora de `0..1`.
- Suite completa verde: 42 tarefas do turbo.
