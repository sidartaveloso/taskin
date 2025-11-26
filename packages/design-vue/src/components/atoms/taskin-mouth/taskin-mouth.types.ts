export type MouthExpression = 'neutral' | 'smile' | 'frown' | 'open';

export interface TaskinMouthProps {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
}
