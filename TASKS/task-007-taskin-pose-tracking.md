# Task 007 — Taskin Pose Tracking with MediaPipe

Status: done  
Type: feat  
Assignee: developer

## Description

Implementar sistema de pose tracking para o Taskin usando MediaPipe Pose Landmarker (https://mediapipe-studio.webapps.google.com/studio/demo/pose_landmarker). O sistema deve detectar a pose corporal do usuário via webcam e mapear os movimentos dos braços, cabeça e tronco para o mascote Taskin em tempo real.

## Objectives

### Phase 1: Arms Tracking (Priority 1)

- [ ] Criar composable `usePoseLandmarker` similar ao `useFaceLandmarker`
- [ ] Implementar detecção de landmarks de pose (33 pontos)
- [ ] Mapear posição dos braços do usuário (shoulders, elbows, wrists) para os braços do Taskin
- [ ] Criar tipos TypeScript para arm positions/states
- [ ] Atualizar `taskin-arms.vue` para aceitar props de posicionamento dinâmico
- [ ] Criar `taskin-arms.stories.ts` com story de Pose Tracking
- [ ] Adicionar controles de sincronização para braços
- [ ] Implementar debug panel para mostrar valores dos landmarks dos braços

### Phase 2: Head & Torso Tracking (Priority 2)

- [ ] Detectar inclinação e rotação da cabeça (nose, ears landmarks)
- [ ] Detectar inclinação do tronco (shoulders, hips alignment)
- [ ] Mapear transformações para cabeça+tronco do Taskin (são uma peça única)
- [ ] Aplicar transformações SVG (rotate, translate, scale) na parte superior do Taskin
- [ ] Criar story combinada mostrando tracking completo (braços + cabeça/tronco)
- [ ] Adicionar controles granulares (sync arms, sync head, sync torso)

### Phase 3: Integration with Full Taskin (Priority 3)

- [ ] Integrar pose tracking no `taskin-with-face-tracking.vue` (renomear para `taskin-with-tracking.vue`?)
- [ ] Combinar face tracking (eyes, mouth) + pose tracking (arms, head, torso)
- [ ] Criar controles unificados para todos os tipos de tracking
- [ ] Otimizar performance (face + pose detection simultânea)
- [ ] Adicionar story completa no organism `taskin-composed.stories.ts`

## Technical Details

### MediaPipe Pose Landmarker

**Key Landmarks for Arms:**

- 11: Left Shoulder
- 12: Right Shoulder
- 13: Left Elbow
- 14: Right Elbow
- 15: Left Wrist
- 16: Right Wrist

**Key Landmarks for Head/Torso:**

- 0: Nose
- 7: Left Ear
- 8: Right Ear
- 11: Left Shoulder
- 12: Right Shoulder
- 23: Left Hip
- 24: Right Hip

### Arm Position Calculation

```typescript
// Calcular ângulo do braço baseado em shoulder -> elbow -> wrist
const leftArmAngle = calculateArmAngle(
  landmarks[11], // left shoulder
  landmarks[13], // left elbow
  landmarks[15], // left wrist
);

// Mapear para path SVG do Taskin
const leftArmPath = generateArmPath(leftArmAngle, 'left');
```

### Head/Torso Transformation

```typescript
// Calcular inclinação da cabeça (ears -> nose angle)
const headTilt = calculateHeadTilt(
  landmarks[7],  // left ear
  landmarks[8],  // right ear
  landmarks[0]   // nose
);

// Calcular inclinação do tronco (shoulders -> hips angle)
const torsoTilt = calculateTorsoTilt(
  landmarks[11], landmarks[12], // shoulders
  landmarks[23], landmarks[24]  // hips
);

// Aplicar transformações no grupo SVG
<g transform="rotate(${headTilt + torsoTilt}, 160, 100)">
  <!-- cabeça + tronco do Taskin -->
</g>
```

## File Structure

```
packages/design-vue/src/
├── composables/
│   ├── use-face-landmarker.ts (existing)
│   └── use-pose-landmarker.ts (new)
├── components/
│   ├── atoms/
│   │   ├── taskin-arms/
│   │   │   ├── taskin-arms.vue (update with dynamic positioning)
│   │   │   ├── taskin-arms.types.ts (new - arm positions/angles)
│   │   │   └── taskin-arms.stories.ts (add Pose Tracking story)
│   │   └── webcam-video/ (existing, reuse)
│   ├── molecules/
│   │   ├── face-tracking-controls/ (existing, extend for pose)
│   │   └── face-tracking-debug/ (existing, extend for pose)
│   └── organisms/
│       └── taskin/
│           ├── taskin-composed.ts (update)
│           ├── taskin-composed.stories.ts (add full tracking story)
│           └── taskin-with-face-tracking.vue (extend to full tracking)
```

## Implementation Steps

### Step 1: Create Pose Landmarker Composable

- Install/verify MediaPipe Pose package
- Create `use-pose-landmarker.ts` with similar API to `use-face-landmarker.ts`
- Implement helper methods: `getArmAngles()`, `getHeadTilt()`, `getTorsoTilt()`
- Add unit tests

### Step 2: Update Arms Component

- Create `taskin-arms.types.ts` with arm position types
- Update `taskin-arms.vue` to accept angle/position props
- Add computed properties to transform SVG paths based on angles
- Maintain backward compatibility (default static pose)

### Step 3: Create Arms Pose Tracking Story

- Add imports for pose tracking in `taskin-arms.stories.ts`
- Create `PoseTracking` story similar to eyes/mouth face tracking stories
- Include webcam, controls, debug panel
- Show both arms moving in real-time

### Step 4: Implement Head/Torso Tracking

- Add transformation logic to parent group containing head+torso
- Calculate combined rotation from head tilt + torso tilt
- Ensure smooth transitions and natural movement limits

### Step 5: Full Integration

- Combine face + pose tracking in organism
- Unified control panel
- Performance optimization
- Complete documentation

## Testing Checklist

- [ ] Arms respond correctly to user arm movements
- [ ] Left arm mirrors correctly (or follows directly based on mirroring setting)
- [ ] Right arm mirrors correctly (or follows directly based on mirroring setting)
- [ ] Head tilt matches user head tilt
- [ ] Torso lean matches user torso lean
- [ ] Performance acceptable with both face + pose detection (>30 FPS)
- [ ] Sync controls work independently (can disable arms but keep face tracking)
- [ ] Freeze behavior works (maintains last position when sync disabled)
- [ ] Debug panel shows accurate landmark values
- [ ] Works on different lighting conditions
- [ ] Works with different camera angles

## Dependencies

- `@mediapipe/tasks-vision` (check if pose is included or needs separate import)
- Existing face tracking infrastructure
- Existing Storybook setup

## Notes

### Design Considerations

1. **Mirroring**: Decide if user's left arm moves Taskin's left arm (mirror mode) or right arm (direct mode)
2. **Movement Limits**: Taskin's arms have physical limits - need to clamp angles to realistic ranges
3. **Smoothing**: May need to add smoothing/interpolation to avoid jittery movements
4. **Performance**: Running face + pose detection simultaneously - may need optimization
5. **Fallback**: If pose not detected, maintain last known position or return to neutral

### Future Enhancements

- Add hand gestures detection (peace sign, thumbs up, etc.)
- Full body tracking (legs movement for full-body Taskin?)
- Expression combinations (happy + arms up = celebrating)
- Record and playback poses
- Pose-based animations triggers

## References

- MediaPipe Pose: https://mediapipe-studio.webapps.google.com/studio/demo/pose_landmarker
- MediaPipe Docs: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
- Existing Face Tracking: `packages/design-vue/src/composables/use-face-landmarker.ts`
- Arms Component: `packages/design-vue/src/components/atoms/taskin-arms/`
