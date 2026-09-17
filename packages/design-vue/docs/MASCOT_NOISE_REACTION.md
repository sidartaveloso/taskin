# Reação "Xiiu" / "Shhh" do mascote

Reação curta e amigável do mascote Taskin ao ruído ambiente. Quando o nível de
áudio captado pelo microfone ultrapassa um limiar configurável, o Taskin faz um
"xiiu/shhh" — um balão de pensamento com `shh...` e, quando o movimento é
permitido, uma mudança de boca/humor — para pedir, sem interromper, que se
baixe o volume. Pensado para demos em sala de aula, workshops e escritórios
compartilhados.

O componente que integra tudo é o organismo `TaskinWithShhh`
(`@opentask/taskin-design-vue`). A medição de ruído vem do utilitário
`createNoiseWatcher` de `@opentask/ui-sense`, e a decisão de _como_ a reação
toca é derivada por funções puras de `@opentask/taskin-types`.

## 🎯 Como funciona

1. `createNoiseWatcher()` abre o microfone (Web Audio API) e emite o nível RMS
   (amplitude, faixa `0..1`).
2. `onNoiseAbove(threshold, cb, { sustainMs, debounceMs })` chama `cb` quando o
   nível se mantém acima do `threshold` por `sustainMs` milissegundos seguidos,
   respeitando o `debounceMs` até o disparo seguinte. O terceiro argumento
   também aceita só um número, que continua significando `debounceMs`.

   Os dois tempos respondem a perguntas diferentes: `sustainMs` é quanto tempo o
   barulho precisa se manter alto **antes** do primeiro pedido de silêncio, e
   `debounceMs` é quanto tempo o mascote fica calado **depois** dele. Com
   `sustainMs` em zero — o padrão — a primeira amostra acima do limiar dispara,
   e uma porta batendo vale o mesmo que um minuto de conversa alta. Uma única
   amostra abaixo do limiar zera a contagem: a sustentação é contínua.

   A configuração persistida (`mascot.reactions.noise` no `.taskin.json`) ainda
   não carrega o `sustainMs` — hoje ele é prop do componente e controle da
   story.
3. A cada disparo o componente resolve o _plano_ da reação com
   `resolveShhhReactionPlan`, honrando a preferência de movimento reduzido do
   sistema (`prefers-reduced-motion`) e a opção de som.

Nenhum áudio é persistido: apenas a amplitude efêmera é lida. O microfone só é
solicitado quando a reação está habilitada.

## 🚀 Como usar

### Passando o bloco de config direto (recomendado)

Repasse o bloco `mascot` como está no `.taskin.json`. O componente aplica os
_defaults_ do schema e usa essas configurações de ruído com precedência sobre as
props `noise*` individuais.

```vue
<template>
  <TaskinWithShhh :mascot="mascotConfig" :mascot-size="300" />
</template>

<script setup lang="ts">
import { TaskinWithShhh } from '@opentask/taskin-design-vue';
import type { MascotConfigInput } from '@opentask/taskin-types';

// Normalmente lido do `.taskin.json`. `MascotConfigInput` e o bloco como se
// escreve — todo campo opcional, porque o schema preenche o resto.
const mascotConfig: MascotConfigInput = {
  reactions: {
    noise: { enabled: true, threshold: 0.7, sound: true, phrase: 'Bruno, Shhhhhhhhhhhh...' },
  },
};
</script>
```

### Passando props individuais

Sem o bloco `mascot`, use as props diretas (todas com defaults conservadores):

```vue
<template>
  <TaskinWithShhh
    :enable-noise-reactions="true"
    :noise-threshold="0.06"
    :noise-debounce-ms="1500"
    :noise-sound="true"
    shhh-phrase="Bruno, Shhhhhhhhhhhh..."
    :shhh-volume="1"
  />
</template>
```

## ⚙️ Configuração no `.taskin.json`

O bloco `mascot.reactions.noise` é validado por `MascotConfigSchema`
(`@opentask/taskin-types`). Todos os campos são opcionais; um bloco ausente
equivale a todos os defaults — o mascote fica em silêncio até ser habilitado.

```json
{
  "mascot": {
    "reactions": {
      "noise": {
        "enabled": true,
        "threshold": 0.7,
        "debounceMs": 5000,
        "sound": true,
        "phrase": "Bruno, Shhhhhhhhhhhh...",
        "volume": 1
      }
    }
  }
}
```

| Campo        | Tipo    | Default | Descrição                                                                                  |
| ------------ | ------- | ------- | ------------------------------------------------------------------------------------------ |
| `enabled`    | boolean | `false` | Liga a reação. Desligada por padrão para nunca pedir o microfone sem intenção do usuário.   |
| `threshold`  | number  | `0.06`  | Amplitude RMS (`0..1`) que o nível ambiente precisa atingir para disparar. Conservador.     |
| `debounceMs` | number  | `1500`  | Intervalo mínimo, em ms, entre duas reações.                                                |
| `sound`      | boolean | `false` | Faz o mascote pedir silêncio em voz alta, junto da reação visual.                           |
| `phrase`     | string  | `"Shhhhhh..."` | O que ele fala e mostra no balão. Pode ter nome: `"Bruno, Shhhhhhhhhhhh..."`.        |
| `volume`     | number  | `1`     | Altura do som, `0..1`. Alto por padrão: a sala precisa ouvir.                               |

### Por que o som importa

O caso de uso é concreto: o Taskin fica no celular, tela ligada, virado para
quem programa. Quando alguém fala alto na sala, é ele quem pede silêncio — em
vez de a pessoa precisar interromper o próprio trabalho para fazer isso. Um
balão na tela não resolve, porque quem está falando não está olhando para a
tela; por isso `sound` precisa sair som de verdade.

São duas camadas, e a segunda nunca falta:

- **a fala**, pelo `speechSynthesis` do próprio navegador, que diz a frase
  inteira — é daí que vem a possibilidade de dirigir o pedido a alguém;
- **o chiado**, sintetizado com Web Audio: ruído branco por um filtro de banda
  alta, que é literalmente o que uma sibilante é. Não há arquivo de áudio para
  baixar, licenciar ou versionar, funciona sem rede, e a duração acompanha os
  `h` da frase — quem escreve `Shhhhhhhhhhhh...` está pedindo mais silêncio que
  quem escreve `Shh`.

O navegador só libera áudio depois de um gesto do usuário na página. Antes
disso o balão aparece e o som não — não é defeito, é política do navegador.

## 🧩 Props do `TaskinWithShhh`

```typescript
interface Props {
  mascotSize?: number; // Padrão: 300
  showWebcam?: boolean; // Padrão: false
  showDebug?: boolean; // Padrão: false

  /**
   * Bloco `mascot` do `.taskin.json`. Quando presente, suas configurações de
   * `reactions.noise` têm precedência sobre as props `noise*` abaixo.
   */
  mascot?: MascotConfig;

  // Usadas quando `mascot` não é informado:
  enableNoiseReactions?: boolean; // Padrão: false
  noiseThreshold?: number; // Padrão: 0.06 (RMS 0..1)
  noiseDebounceMs?: number; // Padrão: 1500
  noiseSound?: boolean; // Padrão: false
}
```

## 🔩 Helpers puros (`@opentask/taskin-types`)

A lógica testável fora do browser vive em funções puras, para que os critérios
de aceitação tenham um único lugar coberto por testes (rodam em Node).

### `resolveMascotNoiseSettings(mascot?)`

Lê o bloco `mascot` (parcial, ausente ou `null`) e devolve as configurações de
ruído já com os defaults do schema aplicados.

```ts
import { resolveMascotNoiseSettings } from '@opentask/taskin-types';

resolveMascotNoiseSettings({ reactions: { noise: { enabled: true } } });
// → { enabled: true, threshold: 0.06, debounceMs: 1500, sound: false }

resolveMascotNoiseSettings(undefined);
// → { enabled: false, threshold: 0.06, debounceMs: 1500, sound: false }
```

### `resolveShhhReactionPlan({ sound, prefersReducedMotion? })`

Decide como uma reação toca, cruzando som e movimento reduzido.

```ts
import { resolveShhhReactionPlan } from '@opentask/taskin-types';

resolveShhhReactionPlan({ sound: false });
// → { animate: true, playSound: false, showBadge: false }

resolveShhhReactionPlan({ sound: true, prefersReducedMotion: true });
// → { animate: false, playSound: true, showBadge: true }
```

## ♿ Acessibilidade

- **`prefers-reduced-motion`**: sob movimento reduzido a reação troca a animação
  por um badge estático (balão `shh...` sem mexer boca/humor). O componente lê a
  preferência via `matchMedia` no momento da reação.
- **Som opcional e curto**: desligado por padrão; a pista é ortogonal ao
  movimento — quem optou por som e usa movimento reduzido ainda ouve.
- **Silêncio por padrão**: sem `enabled: true` explícito, o microfone nunca é
  solicitado.

## 🔒 Privacidade

- Nenhum dado de áudio é gravado ou persistido; apenas métricas de amplitude
  efêmeras são usadas.
- O `NoiseWatcher` é encerrado quando o componente é desmontado
  (`onUnmounted` → `stop()`), liberando o microfone.

## 🧪 Testes

- `@opentask/taskin-types`: parsing do schema, `resolveMascotNoiseSettings` e
  `resolveShhhReactionPlan` (Node, `taskin.schemas.test.ts`).
- `@opentask/ui-sense`: núcleo de limiar/debounce do `NoiseWatcher`
  (`noise-watcher.spec.ts`).
- `@opentask/taskin-design-vue`: `TaskinWithShhh.spec.ts` monta o componente com
  o `@opentask/ui-sense` mockado (roda no browser via Playwright).

## 📚 Relacionados

- [`FACE_TRACKING.md`](./FACE_TRACKING.md) — detecção facial do mascote (a
  reação de shhh também tem uma heurística visual de "boca fechada" via face
  tracking).
