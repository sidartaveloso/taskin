import type { GestureMapping } from '../../../composables/use-gesture-shortcuts';

export interface GestureLegendProps {
  mappings: GestureMapping[];
  compact?: boolean;
}
