import type { TaskinCharacter } from '../components/organisms/taskin/character/character.types';
import { SAPIN_CHARACTER } from '../components/organisms/taskin/characters/sapin/sapin-character';
import { TASKIN_CHARACTER } from '../components/organisms/taskin/characters/taskin/taskin-character';

/**
 * The characters a story can pick. Controls hold the key; Storybook's
 * `mapping` hands the component the character itself, so nothing with a
 * component inside goes through the URL or the controls panel.
 */
export const STORY_CHARACTERS = { taskin: TASKIN_CHARACTER, sapin: SAPIN_CHARACTER } as const;

export type StoryCharacterId = keyof typeof STORY_CHARACTERS;

export const STORY_CHARACTER_IDS = Object.keys(STORY_CHARACTERS) as StoryCharacterId[];

/** The `character` argType: a select over the keys, mapped to the characters. */
export const characterArgType = {
  control: { type: 'select' },
  options: STORY_CHARACTER_IDS,
  mapping: STORY_CHARACTERS,
  description: 'Which character: built with `defineCharacter`, picked here by key.',
} as const;

/** A story arg for a character, by key. `mapping` turns it into the character at render. */
export const characterArg = (id: StoryCharacterId): TaskinCharacter => id as unknown as TaskinCharacter;
