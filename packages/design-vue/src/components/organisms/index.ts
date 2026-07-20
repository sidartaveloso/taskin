// Dashboard organisms
export { default as DashboardHeader } from './DashboardHeader.vue';
export { default as TaskCard } from './TaskCard.vue';
export * from './taskin';

// Re-export GestureSystem (now in UiSense) for backward compatibility
export { GestureSystem, defaultFunctions } from '@opentask/ui-sense';
export type { ConfigurableFunction, GestureSystemProps } from '@opentask/ui-sense';
