import type { TaskinVariant } from './Taskin.variants';

/**
 * As props proprias do `TaskinSays`. Todo o resto (`mood`, `speaking`,
 * `listening`, `juggling`, os olhos...) atravessa para o `Taskin` como attrs.
 */
export interface TaskinSaysProps {
  /** O que o mascote diz. Vazio, nao ha balao, e o `Taskin` fica como esta. */
  text?: string;
  /** Tamanho do mascote, como no `Taskin`. */
  size?: number;
  /** Qual bicho fala; a cor da borda do balao segue a tinta dele. */
  variant?: TaskinVariant;
  /** Desliga o pop de entrada do balao, e as animacoes do `Taskin`. */
  animationsEnabled?: boolean;
  /** Largura maxima do balao, em px. O texto quebra dentro dela. */
  maxWidth?: number;
}
