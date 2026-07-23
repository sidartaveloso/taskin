// Dashboard organisms

export type { ConfigurableFunction, GestureSystemProps } from '@opentask/ui-sense';
// Re-export GestureSystem (now in UiSense) for backward compatibility
export { defaultFunctions, GestureSystem } from '@opentask/ui-sense';
export { default as DashboardHeader } from './DashboardHeader.vue';
export { default as TaskCard } from './TaskCard.vue';
export * from './taskin';
