// Export types first to avoid naming conflicts
export type * from './types';
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
export * from './components/templates';

// Export specific organisms with default exports
export {
  TaskinMascot,
  default as TaskinMascotDefault,
} from './components/organisms/taskin';
export { default as TaskinWithFaceTracking } from './components/organisms/taskin/taskin-with-face-tracking.vue';
export type * from './components/organisms/taskin/taskin.types';

// Export composables
export * from './composables';
