// Import global CSS variables (unscoped)
import './styles/variables.css';

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
  default as TaskinMascotDefault,
  TaskinMascot,
} from './components/organisms/taskin';
export * from './components/organisms/taskin/taskin.types';
export { default as TaskinWithFaceTracking } from './components/organisms/taskin/taskin-with-face-tracking.vue';
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
