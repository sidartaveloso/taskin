import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { characterArg } from '../../../../../storybook/character-control';
import { defineCharacter } from '../../character/define-character';
import Taskin from '../../Taskin';
import { TASKIN_MOODS } from '../../Taskin.moods';
import * as TaskinStories from '../../Taskin.stories';
import { TASKIN_CHARACTER } from '../taskin/taskin-character';
import CharacterAnchors from './CharacterAnchors';

/**
 * O esqueleto: o motor do mascote sem bicho, so com as marcacoes das partes.
 * E de onde uma personagem nova comeca, e o que mostra onde o motor poe olhos,
 * boca, bracos, maos e baloes.
 */
const meta = {
  ...TaskinStories.default,
  title: 'Organisms/Taskin/Characters/Skeleton',
  parameters: {
    ...TaskinStories.default.parameters,
    docs: {
      description: {
        component:
          'O esqueleto do mascote: as ancoras de uma personagem (olhos, boca, ombros, maos do esforco, area e ponta dos baloes) desenhadas como marcacoes. Uma personagem nova nasce de uma copia dele, trocando os dados e as partes desenhadas. `CharacterAnchors` tambem serve de sobreposicao em qualquer personagem.',
      },
    },
  },
  args: { ...TaskinStories.default.args, character: characterArg('skeleton'), size: 420 },
} satisfies Meta<typeof Taskin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Anatomia: Story = {};
export const AllMoods: Story = { ...TaskinStories.AllMoods, args: { ...meta.args, size: 150 } };
export const Actions: Story = { ...TaskinStories.Actions };

/** As ancoras do polvo por cima do desenho dele: e como se confere uma personagem nova contra os dados. */
export const SobreOPolvo: Story = {
  render: () => ({
    components: { Taskin },
    setup: () => ({
      polvoComAncoras: defineCharacter({
        ...TASKIN_CHARACTER,
        parts: { ...TASKIN_CHARACTER.parts, front: CharacterAnchors },
      }),
      moods: TASKIN_MOODS,
    }),
    template: '<Taskin :character="polvoComAncoras" :size="420" :idle-animation="false" />',
  }),
};
