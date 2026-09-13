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
2. `onNoiseAbove(threshold, cb, debounceMs)` chama `cb` quando o nível cruza o
   `threshold`, respeitando o `debounceMs` para não disparar em rajada.
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
import type { MascotConfig } from '@opentask/taskin-types';

// Normalmente lido do `.taskin.json`
const mascotConfig: MascotConfig = {
  reactions: {
    noise: { enabled: true, threshold: 0.7, debounceMs: 5000, sound: false },
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
    :noise-sound="false"
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
        "sound": false
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
| `sound`      | boolean | `false` | Toca a pista de áudio curta opcional junto da reação visual.                                |

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
