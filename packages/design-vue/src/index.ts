// Import global CSS variables (unscoped)
import './styles/variables.css';

/**
 * A folha do ui-sense entra no bundle de CSS deste pacote.
 *
 * Os componentes de sensor (TrackingControls, NoiseTrackingControls,
 * WebcamVideo) vem do `@opentask/ui-sense`, cujo JS ja e embutido aqui — mas o
 * CSS dele e um artefato separado. Sem este import, quem consome o design-vue
 * de fora do monorepo recebe esses componentes sem estilo: botao pelado,
 * checkbox nativo, fieldset sem moldura.
 *
 * Com `cssCodeSplit: false`, o Vite resolve e inlina isto em `dist/index.css`,
 * entao o consumidor precisa de um import so:
 *
 *   import '@opentask/taskin-design-vue/style.css';
 *
 * Custa a duplicacao das regras para quem tambem importa a folha do ui-sense
 * direto — regras iguais, sem efeito visual.
 */
import '@opentask/ui-sense/style.css';

// Export all components by atomic design level
export * from './components/atoms';
// Export molecules manually to handle TimeEstimate conflict
export {
  DayBar,
  ProjectBreadcrumb,
  TaskHeader,
  TimeEstimate,
} from './components/molecules';
export * from './components/molecules/taskin-arm-with-phone';
export * from './components/molecules/taskin-effect-fart-cloud';
export * from './components/molecules/taskin-effect-hearts';
export * from './components/molecules/taskin-effect-phone';
export * from './components/molecules/taskin-effect-tears';
export * from './components/molecules/taskin-effect-thought-bubble';
export * from './components/molecules/taskin-effect-vomit';
export * from './components/molecules/taskin-effect-zzz';
export * from './components/molecules/taskin-tentacle-with-item';
export * from './components/molecules/taskin-tentacles-fluid';
export * from './components/organisms';
// Export specific organisms with default exports
export {
  default as TaskinDefault,
  Taskin,
  TaskinV1,
} from './components/organisms/taskin';
export * from './components/organisms/taskin/Taskin.types';
export { default as TaskinWithFaceTracking } from './components/organisms/taskin/TaskinWithFaceTracking.vue';
export * from './components/pages';
export * from './components/templates';
// Export composables
export * from './composables';
export type {
  DashboardConfig,
  DayProgress,
  ProjectPath,
  Task,
  TaskDates,
  TaskPriority,
  TaskProgress,
  TaskStatus,
  TimeEstimate as TimeEstimateType,
  User,
} from './types';
// Export types first to avoid naming conflicts
export * from './types';
