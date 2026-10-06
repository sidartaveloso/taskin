import { TASKIN_EYE_GEOMETRY } from '../../../atoms/taskin-eyes/TaskinEyes.types';
import type { CharacterPoint, TaskinCharacter } from './character.types';

/**
 * How far one of the character's eyes sits from the reference eyes (the
 * octopus'); `center` is the midpoint of both. The effects tied to the face
 * (tears, Zzz, hearts, sweat) were drawn around the reference eyes: moving with
 * the character's eye, they stay in the same place on any face, with no
 * per-effect position table.
 */
export const eyeShift = (
  character: Pick<TaskinCharacter, 'eyes'>,
  side: 'left' | 'right' | 'center',
): CharacterPoint => {
  const delta = (lado: 'left' | 'right'): CharacterPoint => ({
    x: character.eyes[lado].x - TASKIN_EYE_GEOMETRY[lado].x,
    y: character.eyes[lado].y - TASKIN_EYE_GEOMETRY[lado].y,
  });
  if (side !== 'center') return delta(side);
  const left = delta('left');
  const right = delta('right');
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
};
