/**
 * Internationalization configuration for task file formats
 */

export type Locale = 'en-US' | 'pt-BR';

/**
 * Section names for different locales
 */
export interface TaskFileI18n {
  /** Section name for task status */
  status: string;
  /** Section name for task type */
  type: string;
  /** Section name for task assignee */
  assignee: string;
  /** Section name for task description */
  description: string;
  /** Section name for tasks/checklist */
  tasks: string;
  /** Section name for notes */
  notes: string;
  /** Default assignee text when not specified */
  defaultAssignee: string;
  /** Placeholder text for description */
  descriptionPlaceholder: string;
  /** Placeholder text for notes */
  notesPlaceholder: string;
  /** Field name for manual priority order */
  priority: string;
  /** Field name for the ad hoc group id */
  group: string;
  /** Field name for the ad hoc group display name */
  groupName: string;
  /** Field name for difficulty rating */
  difficulty: string;
}

/**
 * All available translations
 */
export const i18nConfig: Record<Locale, TaskFileI18n> = {
  'en-US': {
    status: 'Status',
    type: 'Type',
    assignee: 'Assignee',
    description: 'Description',
    tasks: 'Tasks',
    notes: 'Notes',
    defaultAssignee: 'To be defined',
    descriptionPlaceholder: 'Add task description here...',
    notesPlaceholder: 'Add any relevant notes or links here.',
    priority: 'Priority',
    group: 'Group',
    groupName: 'GroupName',
    difficulty: 'Difficulty',
  },
  'pt-BR': {
    status: 'Status',
    type: 'Tipo',
    assignee: 'Responsável',
    description: 'Descrição',
    tasks: 'Tarefas',
    notes: 'Notas',
    defaultAssignee: 'A definir',
    descriptionPlaceholder: 'Adicione a descrição da tarefa aqui...',
    notesPlaceholder: 'Adicione notas ou links relevantes aqui.',
    priority: 'Prioridade',
    group: 'Grupo',
    groupName: 'NomeGrupo',
    difficulty: 'Dificuldade',
  },
};

/**
 * Get i18n configuration for a locale
 */
export function getI18n(locale: Locale = 'en-US'): TaskFileI18n {
  return i18nConfig[locale];
}

/**
 * Detect locale from section names in content
 * Useful for parsing existing files that may be in different languages
 */
export function detectLocale(content: string): Locale {
  // Check for Portuguese-specific section names
  if (
    content.includes('## Descrição') ||
    content.includes('## Tipo') ||
    content.includes('## Responsável') ||
    content.includes('## Tarefas')
  ) {
    return 'pt-BR';
  }

  // Default to English
  return 'en-US';
}
