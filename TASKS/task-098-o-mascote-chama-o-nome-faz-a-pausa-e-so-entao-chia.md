# 🧩 Task 098 — o mascote chama o nome, faz a pausa e so entao chia

- Status: done
- Type: fix
- Assignee: Sidarta Veloso
- Priority: 12551

## Description
Hoje o chiado comeca junto com a fala e o speechSynthesis ainda tenta pronunciar Shhhhhhhhhhhh..., entao sai tudo embolado. O nome vira prop propria, e falado sozinho, e o chiado so entra depois de a fala terminar mais um lapso curto — o ritmo de Bruno, shhhhh.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

- [x] Testes antes do código: a fala é só o nome; sem nome não se fala nada; há lapso entre a fala e o chiado; o chiado espera a fala terminar de verdade; uma fala travada não segura o chiado para sempre
- [x] `ShhhPedido.name` e `ShhhPlan.pausaMs` em `planejarShhh`
- [x] `falar` passa a devolver `Promise<void>`, resolvida no `onend` da síntese, com teto de espera
- [x] `shush` sequencia: nome → pausa → chiado
- [x] Prop `shhhName` no `TaskinWithShhh`, balão compondo "nome, frase" e a voz recebendo os dois separados
- [x] Controle `shhhName` no meta da story e a `BrunoShhh` com nome e frase separados
- [x] `MASCOT_NOISE_REACTION.md` e changeset
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### O que estava errado
Duas coisas ao mesmo tempo. O `fonte.start()` do chiado disparava e a fala saía
logo em seguida, então as duas camadas se sobrepunham. E a fala recebia a frase
inteira, incluindo "Shhhhhhhhhhhh...", que a síntese tentava pronunciar como
palavra — um arrastado sem sentido por cima do chiado sintetizado, que é
justamente quem sabe fazer esse som.

### A forma
`name` e `phrase` passam a ter papéis distintos:

- **`shhhName`** é o que a voz pronuncia, com vírgula: "Bruno,". A vírgula não é
  enfeite — é ela que faz a síntese descer a entoação e abrir o espaço.
- **`shhhPhrase`** aparece no balão depois do nome e define a duração do chiado
  pelos seus `h`. Não é falada.

Entre as duas, 260ms de lapso: curto o bastante para continuar sendo a mesma
frase, longo o bastante para não soar como interrupção.

### A rede de segurança
O chiado espera o `onend` da síntese, que é o que dá o ritmo certo. Só que esse
evento não dispara em alguns navegadores quando a aba perde o foco, e o chiado é
a camada que atravessa a sala — a que funciona quando ninguém está olhando para
a tela. Por isso a espera é um `Promise.race` com um teto: se a fala travar, o
chiado sai assim mesmo.

### Evidência
- **Núcleo**: `packages/ui-sense/src/utils/shhh-voice.ts`, com 16 testes em
  `shhh-voice.spec.ts` — incluindo a ordem (`fala` → `pausa:260` → `chiado`), a
  espera pela fala de verdade (uma promessa controlada pelo teste) e a fala
  travada que não segura o chiado.
- **Componente**: `TaskinWithShhh.vue` com a prop `shhhName`, e três testes
  novos/ajustados no `.spec.ts` — o balão junta nome e frase, sem nome mostra só
  a frase, e o `shush` recebe os dois separados.
- **Verificação**: `pnpm lint`, `pnpm format`, `pnpm typecheck` (27/27) e
  `pnpm test` (42/42) verdes.

### Testes que mudaram de contrato
Três testes codificavam o comportamento antigo — falar a frase inteira e chiar
junto. Foram reescritos para o contrato novo, com o motivo registrado no próprio
arquivo, e não apagados.

Um deles eu escrevi errado: `wrapper.text()` inclui o painel de controles em
volta, que tem vírgulas próprias, então "não contém vírgula" não dizia nada
sobre a regra. Passou a olhar o `<text>` de dentro do balão — e não o `<g>`,
que carrega junto o `<style>` das keyframes.

### Fora de escopo
`name` no `MascotNoiseReactionConfigSchema` e no `.taskin.json`. Como nas tasks
093 a 096, isto é Storybook e componente.
