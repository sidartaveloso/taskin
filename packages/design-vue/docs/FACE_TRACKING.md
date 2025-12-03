# Taskin Face Tracking

Sistema de detecção facial em tempo real integrado ao mascote Taskin usando MediaPipe Face Landmarker.

## 🎯 Funcionalidades

### Detecção Facial

- **478 Pontos Faciais (Landmarks)**: Mapeamento completo da geometria facial
- **52 Blendshapes**: Coeficientes de expressões faciais (ARKit compatible)
- **Detecção em Tempo Real**: Via webcam com baixa latência
- **Processamento Local**: Roda no navegador usando WebAssembly + GPU

### Sincronizações Disponíveis

1. **👀 Sincronização de Olhos**
   - Os olhos do Taskin seguem a direção do seu olhar
   - Detecta: olhar para cima/baixo/esquerda/direita
   - Detecta: piscadas e olhos arregalados

2. **👄 Sincronização de Boca**
   - A boca do Taskin abre conforme você abre a sua
   - Detecta grau de abertura em tempo real

3. **😊 Sincronização de Expressões**
   - O mood do Taskin muda baseado em suas expressões:
     - **Sorriso** → `happy`
     - **Franzir** → `annoyed`
     - **Olhos arregalados** → `furious`
     - **Boca aberta** → `sarcastic`
     - **Neutro** → `neutral`

## 🚀 Como Usar

### Componente Completo (Recomendado)

```vue
<template>
  <TaskinWithFaceTracking
    :mascot-size="300"
    :show-webcam="true"
    :show-debug="false"
  />
</template>

<script setup>
import { TaskinWithFaceTracking } from '@opentask/taskin-design-vue';
</script>
```

### Composable (Customizado)

```vue
<template>
  <div>
    <video ref="videoRef" autoplay playsinline />
    <button @click="startDetection">Iniciar</button>

    <TaskinComposed
      :mood="currentMood"
      :eye-tracking-mode="'custom'"
      :eye-custom-position="eyePosition"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useFaceLandmarker, TaskinComposed } from '@opentask/taskin-design-vue';

const videoRef = ref(null);
const currentMood = ref('neutral');
const eyePosition = ref({ x: 0, y: 0 });

const faceLandmarker = useFaceLandmarker(videoRef, {
  enableBlendshapes: true,
  minDetectionConfidence: 0.5,
});

const startDetection = () => {
  faceLandmarker.startDetection();
};

// Sincroniza direção dos olhos
watch(
  () => faceLandmarker.state.value.blendShapes,
  (blendShapes) => {
    if (!blendShapes) return;

    const eyeLook = faceLandmarker.getEyeLookDirection();
    eyePosition.value = { x: eyeLook.x, y: eyeLook.y };

    // Atualiza mood baseado em expressões
    const smile = faceLandmarker.getSmileIntensity();
    currentMood.value = smile > 0.6 ? 'happy' : 'neutral';
  },
);
</script>
```

## 📊 API do Composable

### `useFaceLandmarker(videoElement, options)`

#### Parâmetros

```typescript
interface UseFaceLandmarkerOptions {
  enableBlendshapes?: boolean; // Padrão: true
  minDetectionConfidence?: number; // Padrão: 0.5 (0.0 - 1.0)
  minTrackingConfidence?: number; // Padrão: 0.5 (0.0 - 1.0)
  onDetection?: (result) => void; // Callback opcional
}
```

#### Retorno

```typescript
{
  state: Ref<FaceLandmarkerState>,     // Estado reativo da detecção
  startDetection: () => Promise<void>, // Inicia webcam e detecção
  stopDetection: () => void,           // Para detecção e webcam

  // Helpers para extrair informações
  getEyeLookDirection: () => { x: number, y: number },
  getEyeOpenness: () => { left: number, right: number },
  isEyesWide: () => boolean,
  getMouthOpenness: () => number,
  getSmileIntensity: () => number,
  getFrownIntensity: () => number,
}
```

### Estado da Detecção

```typescript
interface FaceLandmarkerState {
  isReady: boolean; // MediaPipe carregado
  isDetecting: boolean; // Webcam ativa e detectando
  error: string | null; // Mensagem de erro se houver
  blendShapes: FaceLandmarkerBlendShapes | null; // 52 coeficientes
  landmarks: Array<{ x; y; z }> | null; // 478 pontos faciais
}
```

### Blendshapes Principais

```typescript
interface FaceLandmarkerBlendShapes {
  // Olhos
  eyeBlinkLeft: number; // 0 = aberto, 1 = fechado
  eyeBlinkRight: number;
  eyeLookUpLeft: number; // Olhar para cima
  eyeLookDownLeft: number; // Olhar para baixo
  eyeLookInLeft: number; // Olhar para dentro
  eyeLookOutLeft: number; // Olhar para fora
  eyeWideLeft: number; // Olhos arregalados
  eyeSquintLeft: number; // Olhos semicerrados

  // Boca
  jawOpen: number; // 0 = fechada, 1 = totalmente aberta
  mouthSmileLeft: number; // Intensidade do sorriso
  mouthSmileRight: number;
  mouthFrownLeft: number; // Franzir
  mouthFrownRight: number;
  mouthPucker: number; // Bico

  // ... 52 blendshapes no total
}
```

## 🎮 Props do TaskinProps

Novas propriedades adicionadas para suportar face tracking:

```typescript
interface TaskinProps {
  // ... props existentes

  enableFaceLandmarker?: boolean; // Ativa detecção facial
  syncMouth?: boolean; // Sincroniza boca
  syncEyes?: boolean; // Sincroniza olhos
  syncExpressions?: boolean; // Sincroniza expressões/mood
}
```

## 🔧 Requisitos Técnicos

### Navegador

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Suporte a WebRTC (getUserMedia)
- Suporte a WebAssembly

### Permissões

- Acesso à webcam (solicitado ao usuário)
- Conexão com internet (para baixar modelo ~10MB na primeira vez)

### Performance

- **CPU**: Dual-core 2.0 GHz+ recomendado
- **GPU**: Acelera processamento se disponível (via WebGL)
- **FPS**: 30-60 fps dependendo do hardware
- **Latência**: < 50ms típico

## 📦 Dependências

```json
{
  "@mediapipe/tasks-vision": "latest" // Carregado via CDN
}
```

O MediaPipe é carregado dinamicamente via CDN quando `startDetection()` é chamado.
Não há necessidade de instalar manualmente.

## 🎯 Exemplos de Uso

### Exemplo 1: Avatar Interativo

```vue
<TaskinWithFaceTracking :mascot-size="400" :show-webcam="false" />
```

### Exemplo 2: Video Conference

```vue
<div style="display: flex; gap: 20px;">
  <video ref="localVideo" autoplay />
  <TaskinComposed
    :eye-tracking-mode="'custom'"
    :eye-custom-position="eyePosition"
    :mood="detectedMood"
  />
</div>
```

### Exemplo 3: Jogo Interativo

```vue
<script setup>
const faceLandmarker = useFaceLandmarker(videoRef);

watch(
  () => faceLandmarker.getMouthOpenness(),
  (openness) => {
    if (openness > 0.7) {
      // Jogador "gritou" - ativa power-up
      activatePowerUp();
    }
  },
);

watch(
  () => faceLandmarker.isEyesWide(),
  (isWide) => {
    if (isWide) {
      // Jogador está surpreso
      showSurpriseEffect();
    }
  },
);
</script>
```

## 🐛 Troubleshooting

### Erro: "Webcam não acessível"

- Verifique permissões do navegador
- Tente usar HTTPS (getUserMedia requer contexto seguro)
- Verifique se outra aplicação está usando a webcam

### Erro: "Falha ao carregar MediaPipe"

- Verifique conexão com internet
- Verifique se CDN está acessível
- Tente limpar cache do navegador

### Performance Baixa

- Reduza resolução da webcam
- Desative GPU acceleration se houver problemas
- Use `minDetectionConfidence` mais alto (0.7)

## 📚 Recursos

- [MediaPipe Face Landmarker](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [ARKit Blend Shapes](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation)
- [WebRTC getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## 🎨 Storybook

Veja exemplos interativos no Storybook:

```bash
pnpm storybook
```

Navegue para: **Organisms > Taskin > Face Tracking**

## 📝 Licença

Este componente faz parte do `@opentask/taskin-design-vue` e segue a mesma licença do pacote principal.
