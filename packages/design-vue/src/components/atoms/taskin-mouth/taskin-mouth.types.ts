export type MouthExpression =
  | 'neutral'
  | 'smile'
  | 'frown'
  | 'open'
  | 'wide-open'
  | 'o-shape'
  | 'smirk'
  | 'surprised';

export interface TaskinMouthProps {
  expression?: MouthExpression;
  animationsEnabled?: boolean;
}
