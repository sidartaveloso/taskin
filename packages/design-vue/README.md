# @opentask/taskin-design-vue

> Vue 3 design system components for Taskin - including the official mascot and UI elements

## 📦 Installation

```bash
npm install @opentask/taskin-design-vue
# or
pnpm add @opentask/taskin-design-vue
```

## 🚀 Quick Start

### Using the Taskin Mascot

```vue
<script setup lang="ts">
import { TaskinV1 } from '@opentask/taskin-design-vue';
import '@opentask/taskin-design-vue/style.css';
import { ref } from 'vue';

const taskinRef = ref();

const handleReady = (payload) => {
  console.log('Taskin is ready!', payload);

  // Use the controller to interact with the mascot
  payload.controller.celebrate();
};

const celebrate = () => {
  taskinRef.value?.celebrate();
};
</script>

<template>
  <div>
    <TaskinV1
      ref="taskinRef"
      :size="220"
      mood="sarcastic"
      :idle-animation="true"
      :animations-enabled="true"
      @ready="handleReady"
    />
    <button @click="celebrate">Celebrate!</button>
  </div>
</template>
```

## 🎭 Components

### TaskinMascot

The official Taskin mascot component with animations and moods.

#### Props

- `size` (Number, default: 220) - Size of the mascot in pixels
- `mood` (String, default: 'sarcastic') - Mood of the mascot
- `idleAnimation` (Boolean, default: true) - Enable idle animations
- `animationsEnabled` (Boolean, default: true) - Enable all animations
- `character` (`TaskinCharacter`, default: `TASKIN_CHARACTER`) - Who the mascot is

#### Characters

`Taskin` is an engine. It owns the behaviour: moods, blinking, eye tracking,
speech, one-shot actions (`play`) and the effects. Who the mascot is comes from
`character`, a typed object built with `defineCharacter`:

| Field | What it holds |
| --- | --- |
| `id`, `name` | Stable kebab-case id (names `#<id>-motion`, prefixes the CSS) and a human name |
| `colors` | Base colours, for the moods that have none |
| `eyes`, `mouth`, `arms` | Where the eyes, mouth and shoulders sit, and how they look |
| `shadow` | The ellipse on the ground |
| `parts` | The drawings: `body` (required), `back` (behind it) and `front` (after the mouth). Each receives `CharacterPartProps` |
| `motion` | The CSS of the whole character, the class per mood, and the `listening`, `speaking` and `juggling` classes |
| `actions` | What each one-shot action does on this character; a missing one resolves `false` |
| `listening` | The pose held while the microphone is on |
| `bubbles`, `effortHands` | Where the bubbles go and point, and where the bar of `effort` rests |

Three characters ship with the package:

- `TASKIN_CHARACTER`, the octopus: the default.
- `SKELETON_CHARACTER`, the engine with no animal, drawn as markings of every
  anchor. A new character starts from a copy of it.
- `CharacterAnchors`, a part that draws any character's anchors: put it in
  `parts.front` of a copy to check a drawing against its data.

```ts
import { defineCharacter, SKELETON_CHARACTER, WAVE } from '@opentask/taskin-design-vue';
import MyBody from './MyBody.vue';

export const MY_CHARACTER = defineCharacter({
  ...SKELETON_CHARACTER,
  id: 'my-character',
  name: 'My character',
  colors: { bodyColor: '#e07a5f', bodyHighlight: '#f2cc8f', tentacleColor: '#e07a5f' },
  parts: { body: MyBody },
  motion: { byMood: {}, listeningClass: 'my-character-listening', css: '' },
  actions: { wave: { className: 'my-character-wave', durationMs: 1400, pose: WAVE } },
});
```

```vue
<Taskin :character="MY_CHARACTER" mood="happy" />
```

`defineCharacter` refuses an id that is not kebab-case and a CSS class that is
not prefixed with the id: the `<style>` inside the SVG applies to the whole
page, so two characters would restyle each other. The effects tied to the face
were drawn around the octopus' eyes, which are the engine's reference frame:
they move by however much a character's eyes or mouth sit away from them
(`eyeShift`). `TaskinSays`, `TaskinWithShhh` and `TaskinWithFaceTracking` pass
`character` through. The stories live under *Organisms/Taskin/Characters*.

#### Events

- `@ready` - Emitted when the mascot is ready, provides controller instance

#### Controller Methods

- `celebrate()` - Play celebration animation
- `wave()` - Play wave animation
- `thinking()` - Show thinking animation
- `sleep()` - Put mascot to sleep
- `wakeUp()` - Wake up mascot

### Interactive mascots

- **`TaskinWithFaceTracking`** — mascot synced to your face via webcam. See
  [`docs/FACE_TRACKING.md`](./docs/FACE_TRACKING.md).
- **`TaskinWithShhh`** — mascot that reacts to ambient noise with a short
  "xiiu/shhh". Configurable via the `mascot` block of `.taskin.json`, honours
  `prefers-reduced-motion`, and never asks for the microphone unless enabled.
  See [`docs/MASCOT_NOISE_REACTION.md`](./docs/MASCOT_NOISE_REACTION.md).

## 🎨 Development

### Storybook

```bash
pnpm storybook
```

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

## 📝 License

MIT

## 🔗 Related Packages

- [@opentask/taskin-dashboard](../dashboard) - Dashboard components
- [@opentask/taskin-core](../core) - Core task management
