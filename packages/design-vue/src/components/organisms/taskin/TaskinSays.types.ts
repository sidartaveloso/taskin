import type { SpeechBubbleKind } from '../../atoms/speech-bubble/SpeechBubble.types';
import type { TaskinCharacter } from './character/character.types';

/**
 * As props proprias do `TaskinSays`. Todo o resto (`mood`, `speaking`,
 * `listening`, `juggling`, os olhos...) atravessa para o `Taskin` como attrs.
 */
export interface TaskinSaysProps {
  /** O que o mascote diz. Vazio, nao ha balao, e o `Taskin` fica como esta. */
  text?: string;
  /** Tamanho do mascote, como no `Taskin`. */
  size?: number;
  /** Quem fala (padrao: o polvo); sem `bubbleBorderColor`, a borda do balao segue a tinta dele. */
  character?: TaskinCharacter;
  /** Desliga o pop de entrada do balao, e as animacoes do `Taskin`. */
  animationsEnabled?: boolean;
  /** Largura maxima do balao, em px. O texto quebra dentro dela. */
  maxWidth?: number;
  /** Cor de fundo do balao. Sem ela, `--speech-bubble-bg` ou branco. */
  bubbleBackground?: string;
  /** Cor da borda do balao. Sem ela, `--speech-bubble-border-color` ou a tinta da personagem. */
  bubbleBorderColor?: string;
  /** Cor do texto do balao. Sem ela, `--speech-bubble-text-color` ou `#2c3e50`. */
  bubbleTextColor?: string;
  /** Espessura da borda do balao, em px. Padrao: 2. */
  bubbleBorderWidth?: number;
  /** Tamanho da fonte do balao, em px. Padrao: 15. */
  bubbleFontSize?: number;
  /** Como o mascote fala: `speech`, `shout`, `whisper`, `thought` ou `narration`. Padrao: `speech`. */
  bubbleKind?: SpeechBubbleKind;
}
