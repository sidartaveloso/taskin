import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Taskin from './Taskin';
import { TASKIN_MOODS } from './Taskin.moods';
import * as TaskinStories from './Taskin.stories';
import { TASKIN_VARIANTS } from './Taskin.variants';

/**
 * O Sapin nao e outro componente: e o `Taskin` com `variant="sapin"`. Por isso as
 * stories sao as do Taskin, reaproveitadas uma a uma — o `variant` vem dos
 * `args` do meta, e cada story nova do Taskin so precisa de uma linha aqui para
 * existir no sapinho tambem.
 */
const meta = {
  ...TaskinStories.default,
  title: 'Organisms/Taskin/Sapin',
  parameters: {
    ...TaskinStories.default.parameters,
    docs: {
      description: {
        component:
          'O Sapin, sapinho da marca para SAP: a variante `sapin` do mascote Taskin. Mesmo componente (`<Taskin variant="sapin">`), com os mesmos humores, comportamentos e movimentos — no lugar dos tentaculos, pernas; o sapo inteiro pula, flutua, balanca, treme e arfa.',
      },
    },
  },
  args: {
    ...TaskinStories.default.args,
    variant: 'sapin',
  },
} satisfies Meta<typeof Taskin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllMoods: Story = { ...TaskinStories.AllMoods };
export const Default: Story = { ...TaskinStories.Default };
export const Happy: Story = { ...TaskinStories.Happy };
export const Crying: Story = { ...TaskinStories.Crying };
export const Furious: Story = { ...TaskinStories.Furious };
export const Thinking: Story = { ...TaskinStories.Thinking };
export const Annoyed: Story = { ...TaskinStories.Annoyed };
export const Cold: Story = { ...TaskinStories.Cold };
export const Hot: Story = { ...TaskinStories.Hot };
export const Dancing: Story = { ...TaskinStories.Dancing };
export const Sleeping: Story = { ...TaskinStories.Sleeping };
export const InLove: Story = { ...TaskinStories.InLove };
export const Tired: Story = { ...TaskinStories.Tired };
export const Thoughtful: Story = { ...TaskinStories.Thoughtful };
export const Vomiting: Story = { ...TaskinStories.Vomiting };
export const TakingSelfie: Story = { ...TaskinStories.TakingSelfie };
export const Farting: Story = { ...TaskinStories.Farting };

export const WithIdleAnimations: Story = {
  ...TaskinStories.WithIdleAnimations,
  parameters: {
    docs: {
      description: {
        story: 'Sapin with idle animations enabled. Watch it blink and tap its toes every few seconds.',
      },
    },
  },
};

export const WithoutAnimations: Story = { ...TaskinStories.WithoutAnimations };
export const EyeTrackingMouse: Story = { ...TaskinStories.EyeTrackingMouse };
export const EyeTrackingElement: Story = { ...TaskinStories.EyeTrackingElement };
export const EyeTrackingCustomPosition: Story = { ...TaskinStories.EyeTrackingCustomPosition };

/** Os dois bichos lado a lado, humor por humor: a variacao e so o desenho. */
export const Variantes: Story = {
  render: () => ({
    components: { Taskin },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px 28px; padding: 20px;">
        <div v-for="mood in moods" :key="mood" style="text-align: center;">
          <div style="display: flex; gap: 4px; align-items: flex-end;">
            <Taskin v-for="variant in variants" :key="variant" :variant="variant" :mood="mood" :size="110" />
          </div>
          <p style="margin-top: 6px; font-size: 12px;">{{ mood }}</p>
        </div>
      </div>
    `,
    data() {
      return { moods: TASKIN_MOODS, variants: TASKIN_VARIANTS };
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Taskin and Sapin side by side, mood by mood: same moods and palette, a different character.',
      },
    },
  },
};
