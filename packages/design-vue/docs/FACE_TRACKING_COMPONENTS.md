# Face Tracking Components

Componentes isolados para suporte a face tracking, seguindo o design atômico do projeto.

## Componentes Criados

### 1. WebcamVideo (Atom)

**Localização:** `src/components/atoms/webcam-video/`

Componente de vídeo da webcam com controle de visibilidade e espelhamento.

**Props:**

- `visible` - Mostrar ou ocultar o feed da webcam
- `width` - Largura do vídeo (default: 320)
- `height` - Altura do vídeo (default: 240)
- `mirrored` - Espelhar o vídeo horizontalmente (default: true)

**Exposed:**

- `videoElement` - Referência ao elemento `<video>` para uso com `useFaceLandmarker`

**Arquivos:**

- `index.ts` - Exportações
- `webcam-video.types.ts` - Tipos TypeScript
- `webcam-video.vue` - Componente Vue
- `webcam-video.stories.ts` - Stories do Storybook

### 2. FaceTrackingControls (Molecule)

**Localização:** `src/components/molecules/face-tracking-controls/`

Painel de controles para configurar e monitorar o face tracking.

**Props:**

- `isDetecting` - Indica se está detectando faces
- `error` - Mensagem de erro (se houver)
- `showWebcam` - Mostrar webcam (v-model)
- `syncEyes` - Sincronizar olhos (v-model)
- `syncMouth` - Sincronizar boca (v-model)
- `syncExpressions` - Sincronizar expressões (v-model)
- `disabled` - Desabilitar botão de início/parada

**Emits:**

- `toggle-tracking` - Alternar detecção
- `update:showWebcam` - Atualizar visibilidade da webcam
- `update:syncEyes` - Atualizar sincronização dos olhos
- `update:syncMouth` - Atualizar sincronização da boca
- `update:syncExpressions` - Atualizar sincronização de expressões

**Arquivos:**

- `index.ts` - Exportações
- `face-tracking-controls.types.ts` - Tipos TypeScript
- `face-tracking-controls.vue` - Componente Vue
- `face-tracking-controls.stories.ts` - Stories do Storybook

### 3. FaceTrackingDebug (Molecule)

**Localização:** `src/components/molecules/face-tracking-debug/`

Painel de debug para exibir informações de face tracking em tempo real.

**Props:**

- `data` - Objeto com dados de debug
- `title` - Título do painel (default: "Debug Info")
- `position` - Posição do painel: `top-right` | `top-left` | `bottom-right` | `bottom-left`

**Arquivos:**

- `index.ts` - Exportações
- `face-tracking-debug.types.ts` - Tipos TypeScript
- `face-tracking-debug.vue` - Componente Vue
- `face-tracking-debug.stories.ts` - Stories do Storybook

## Refatoração do TaskinWithFaceTracking

O componente `taskin-with-face-tracking.vue` foi refatorado para usar os novos componentes isolados:

**Mudanças:**

- Substituiu HTML inline da webcam por `<WebcamVideo>`
- Substituiu controles inline por `<FaceTrackingControls>`
- Substituiu debug info inline por `<FaceTrackingDebug>`
- CSS reduzido de ~150 linhas para ~20 linhas
- Código mais limpo e reutilizável

## Stories com Face Tracking

### TaskinEyes com Face Tracking

**Localização:** `src/components/atoms/taskin-eyes/taskin-eyes.stories.ts`

Nova story `FaceTracking` que demonstra:

- Olhos seguindo o movimento da cabeça via webcam
- Sincronização do estado dos olhos (aberto/fechado/arregalado)
- Debug info mostrando direção do olhar e abertura dos olhos

### TaskinArmWithPhone com Face Tracking

**Localização:** `src/components/molecules/taskin-arm-with-phone/taskin-arm-with-phone.stories.ts`

Nova story `FaceTracking` que demonstra:

- Braços se movendo baseado na direção do olhar
- Braço direito levanta quando olha para a esquerda
- Braço esquerdo levanta quando olha para a direita
- Debug info mostrando direção do olhar e rotação dos braços

## Benefícios

1. **Reutilização:** Componentes podem ser usados em qualquer story ou aplicação
2. **Separação de Responsabilidades:** Cada componente tem uma única responsabilidade
3. **Testabilidade:** Componentes isolados são mais fáceis de testar
4. **Manutenibilidade:** Mudanças em um componente não afetam os outros
5. **Design Atômico:** Seguindo a convenção do projeto (atoms, molecules, organisms)
6. **Documentação:** Cada componente tem seus próprios stories no Storybook

## Uso Exemplo

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import WebcamVideo from '@/components/atoms/webcam-video';
import FaceTrackingControls from '@/components/molecules/face-tracking-controls';
import FaceTrackingDebug from '@/components/molecules/face-tracking-debug';
import { useFaceLandmarker } from '@/composables/use-face-landmarker';

const webcamRef = ref(null);
const videoElement = ref(null);
const showWebcam = ref(false);
const syncEyes = ref(true);

onMounted(() => {
  if (webcamRef.value) {
    videoElement.value = webcamRef.value.videoElement;
  }
});

const faceLandmarker = useFaceLandmarker(videoElement, {
  enableBlendshapes: true,
});

const toggleTracking = () => {
  if (faceLandmarker.state.value.isDetecting) {
    faceLandmarker.stopDetection();
  } else {
    faceLandmarker.startDetection();
  }
};

// Sincronização...
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    // Sua lógica de sincronização aqui
  },
);
</script>

<template>
  <div>
    <WebcamVideo ref="webcamRef" :visible="showWebcam" />

    <FaceTrackingControls
      v-model:show-webcam="showWebcam"
      v-model:sync-eyes="syncEyes"
      :is-detecting="faceLandmarker.state.value.isDetecting"
      :error="faceLandmarker.state.value.error"
      @toggle-tracking="toggleTracking"
    />

    <FaceTrackingDebug :data="debugData" position="top-right" />
  </div>
</template>
```
