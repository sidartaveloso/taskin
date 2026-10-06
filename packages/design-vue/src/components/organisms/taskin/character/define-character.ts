import type { TaskinCharacter } from './character.types';

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Builds a character. The type parameter keeps the literals (the action table
 * stays exactly what was written), and the checks catch what the type cannot:
 * an id that would break the CSS class names, and action classes that are not
 * prefixed with the id (a `<style>` in an SVG applies to the whole document,
 * so two characters on one page would restyle each other).
 */
export function defineCharacter<const C extends TaskinCharacter>(character: C): C {
  if (!KEBAB.test(character.id)) {
    throw new Error(`Character id "${character.id}" must be kebab-case: it prefixes CSS classes.`);
  }
  const prefix = `${character.id}-`;
  const classes = [
    ...Object.values(character.actions).map((a) => a?.className),
    ...Object.values(character.motion.byMood),
    character.motion.listeningClass,
    character.motion.speakingClass,
    character.motion.jugglingClass,
  ].filter((c): c is string => typeof c === 'string');
  const foreign = classes.filter((c) => !c.startsWith(prefix));
  if (foreign.length > 0) {
    throw new Error(`Character "${character.id}": classes must start with "${prefix}": ${foreign.join(', ')}`);
  }
  return Object.freeze(character);
}
