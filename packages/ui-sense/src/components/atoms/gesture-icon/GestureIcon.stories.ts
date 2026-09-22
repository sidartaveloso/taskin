import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import GestureIcon from './GestureIcon.vue';

const meta = {
  title: 'Atoms/Sense/GestureIcon',
  component: GestureIcon,
  tags: ['autodocs', 'ui-sense'],
  parameters: {
    docs: {
      description: {
        component:
          'Renderiza o emoji + label opcional de um gesto. Aceita valores lowercase (`pointing_up`, `closed_fist`...) ou no formato MediaPipe (`Pointing_Up`, `Closed_Fist`...).',
      },
    },
  },
} satisfies Meta<typeof GestureIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllGestures: Story = {
  render: () => ({
    setup() {
      const gestures = [
        'pointing_up',
        'thumb_down',
        'thumb_up',
        'victory',
        'open_palm',
        'closed_fist',
        'iloveyou',
        'none',
      ];
      return () =>
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'system-ui, sans-serif' } },
          [
            h(
              'div',
              { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } },
              gestures.map((g) =>
                h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }, [
                  h(GestureIcon, { gesture: g, size: 'lg', showLabel: true }),
                  h('span', { style: { fontSize: '11px', color: '#999' } }, g),
                ]),
              ),
            ),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Todos os gestos suportados no tamanho lg com label.',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => ({
    setup() {
      return () =>
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '24px', fontFamily: 'system-ui, sans-serif' } },
          [
            h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }, [
              h(GestureIcon, { gesture: 'pointing_up', size: 'sm' }),
              h('span', { style: { fontSize: '11px', color: '#999' } }, 'sm'),
            ]),
            h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }, [
              h(GestureIcon, { gesture: 'pointing_up', size: 'md' }),
              h('span', { style: { fontSize: '11px', color: '#999' } }, 'md'),
            ]),
            h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' } }, [
              h(GestureIcon, { gesture: 'pointing_up', size: 'lg' }),
              h('span', { style: { fontSize: '11px', color: '#999' } }, 'lg'),
            ]),
          ],
        );
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Three sizes available: sm (16px), md (24px), lg (36px).',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => ({
    setup() {
      return () => h(GestureIcon, { gesture: 'closed_fist', showLabel: true });
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'With the label beside it. Useful for legends and mapping lists.',
      },
    },
  },
};
