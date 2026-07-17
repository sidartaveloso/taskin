import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import type { GestureMapping } from '../../../composables/use-gesture-shortcuts';
import GestureLegend from './gesture-legend.vue';

const meta = {
  title: 'Molecules/GestureLegend',
  component: GestureLegend,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Exibe os mapeamentos gesto→ação atuais em pills compactas. Usado pelo GestureSystem para o usuário lembrar quais gestos estão configurados.',
      },
    },
  },
} satisfies Meta<typeof GestureLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultMappings: GestureMapping[] = [
  { gesture: 'Pointing_Up', action: 'moveUp' },
  { gesture: 'Thumb_Down', action: 'moveDown' },
  { gesture: 'Victory', action: 'groupWith' },
  { gesture: 'Open_Palm', action: 'ungroup' },
  { gesture: 'Closed_Fist', action: 'undo' },
];

export const Default: Story = {
  render: () => ({
    setup() {
      return () => h(GestureLegend, { mappings: defaultMappings });
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Display padrão com 5 mapeamentos. Cada pill mostra emoji do gesto + nome da ação.',
      },
    },
  },
};

export const Compact: Story = {
  render: () => ({
    setup() {
      return () => h(GestureLegend, { mappings: defaultMappings, compact: true });
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Versão compacta com padding e fonte reduzidos. Usada pelo GestureSystem no canto da tela.',
      },
    },
  },
};

export const SingleMapping: Story = {
  render: () => ({
    setup() {
      return () => h(GestureLegend, { mappings: [{ gesture: 'Pointing_Up', action: 'moveUp' }] });
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Apenas um mapeamento configurado. Os demais podem estar sem gesto atribuído.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => ({
    setup() {
      return () =>
        h('div', { style: { padding: '16px', fontFamily: 'system-ui, sans-serif', color: '#999' } }, [
          'Nenhum mapping visível quando todos têm gesture=None ou action=none.',
        ]);
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Nenhum mapping é renderizado quando todos têm gesture `None` ou action `none`. O componente simplesmente não aparece — vazio intencional.',
      },
    },
  },
};
