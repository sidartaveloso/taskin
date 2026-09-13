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
