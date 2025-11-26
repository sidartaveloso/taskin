import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import TaskinEffectFartCloud from './taskin-effect-fart-cloud/taskin-effect-fart-cloud';
import TaskinEffectHearts from './taskin-effect-hearts/taskin-effect-hearts';
import TaskinEffectPhone from './taskin-effect-phone/taskin-effect-phone';
import TaskinEffectTears from './taskin-effect-tears/taskin-effect-tears';
import TaskinEffectThoughtBubble from './taskin-effect-thought-bubble/taskin-effect-thought-bubble';
import TaskinEffectVomit from './taskin-effect-vomit/taskin-effect-vomit';
import TaskinEffectZzz from './taskin-effect-zzz/taskin-effect-zzz';

const meta = {
  title: 'Molecules/Effects',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Documentation: Story = {
  render: () => ({
    setup() {
      const effects = [
        {
          name: 'Tears',
          component: TaskinEffectTears,
          description: 'Crying effect',
        },
        {
          name: 'Hearts',
          component: TaskinEffectHearts,
          description: 'In love effect',
        },
        {
          name: 'Zzz',
          component: TaskinEffectZzz,
          description: 'Sleeping effect',
        },
        {
          name: 'Thought Bubble',
          component: TaskinEffectThoughtBubble,
          description: 'Thinking effect',
          props: { text: '💭' },
        },
        {
          name: 'Vomit',
          component: TaskinEffectVomit,
          description: 'Sick effect',
        },
        {
          name: 'Phone',
          component: TaskinEffectPhone,
          description: 'Selfie effect',
        },
        {
          name: 'Fart Cloud',
          component: TaskinEffectFartCloud,
          description: 'Farting effect',
        },
      ];

      return () =>
        h(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
              padding: '1rem',
            },
          },
          effects.map((effect) =>
            h(
              'div',
              {
                key: effect.name,
                style: {
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                },
              },
              [
                h(
                  'svg',
                  {
                    width: '150',
                    height: '150',
                    viewBox: '0 0 320 260',
                    style: {
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                    },
                  },
                  [
                    h(effect.component, {
                      animationsEnabled: true,
                      ...effect.props,
                    }),
                  ],
                ),
                h(
                  'p',
                  {
                    style: {
                      margin: '0.5rem 0 0',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    },
                  },
                  effect.name,
                ),
                h(
                  'p',
                  {
                    style: {
                      margin: '0.25rem 0 0',
                      fontSize: '0.85rem',
                      color: '#666',
                    },
                  },
                  effect.description,
                ),
              ],
            ),
          ),
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Overview of all Taskin effect components - tears, hearts, sleep, thoughts, vomit, phone, and fart cloud',
      },
    },
  },
};
