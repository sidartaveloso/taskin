import type { CannedGesture } from '../../../composables/use-gesture-recognizer';
import type { PrioritizationAction } from '../../../composables/use-gesture-shortcuts';

export interface ConfigurableFunction {
  id: PrioritizationAction;
  title: string;
  description?: string;
  keyboardShortcut?: string;
  defaultGesture?: CannedGesture;
}

export interface GestureSystemProps {
  functions: ConfigurableFunction[];
  userId: string;
  detecting: boolean;
}

export const defaultFunctions: ConfigurableFunction[] = [
  {
    id: 'moveUp',
    title: 'Mover para cima',
    description: 'Aumenta a prioridade da tarefa focada',
    keyboardShortcut: '⌘↑',
    defaultGesture: 'Pointing_Up',
  },
  {
    id: 'moveDown',
    title: 'Mover para baixo',
    description: 'Diminui a prioridade da tarefa focada',
    keyboardShortcut: '⌘↓',
    defaultGesture: 'Thumb_Down',
  },
  {
    id: 'groupWith',
    title: 'Agrupar',
    description: 'Agrupa a tarefa focada com a adjacente',
    keyboardShortcut: '⌘G',
    defaultGesture: 'Victory',
  },
  {
    id: 'ungroup',
    title: 'Desagrupar',
    description: 'Dissolve o grupo focado',
    keyboardShortcut: '⌘⇧G',
    defaultGesture: 'Open_Palm',
  },
  {
    id: 'setDifficulty1',
    title: 'Dificuldade 1',
    description: 'Marca dificuldade como muito fácil',
    keyboardShortcut: '⌘1',
  },
  {
    id: 'setDifficulty2',
    title: 'Dificuldade 2',
    description: 'Marca dificuldade como fácil',
    keyboardShortcut: '⌘2',
  },
  {
    id: 'setDifficulty3',
    title: 'Dificuldade 3',
    description: 'Marca dificuldade como média',
    keyboardShortcut: '⌘3',
  },
  {
    id: 'setDifficulty4',
    title: 'Dificuldade 4',
    description: 'Marca dificuldade como difícil',
    keyboardShortcut: '⌘4',
  },
  {
    id: 'setDifficulty5',
    title: 'Dificuldade 5',
    description: 'Marca dificuldade como muito difícil',
    keyboardShortcut: '⌘5',
  },
  {
    id: 'undo',
    title: 'Desfazer',
    description: 'Desfaz a última ação',
    keyboardShortcut: '⌘Z',
    defaultGesture: 'Closed_Fist',
  },
  {
    id: 'copyCard',
    title: 'Copiar card',
    description: 'Copia o texto do card focado',
    keyboardShortcut: '⌘C',
  },
];
