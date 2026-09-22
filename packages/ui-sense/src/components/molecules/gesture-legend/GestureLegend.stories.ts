import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import type { GestureMapping } from '../../../composables/use-gesture-shortcuts';
import GestureLegend from './GestureLegend.vue';

const meta = {
  title: 'Molecules/Sense/GestureLegend',
  component: GestureLegend,
  tags: ['autodocs', 'ui-sense'],
  parameters: {
    docs: {
      description: {
        component:
          'Shows the current gesture-to-action mappings as compact pills. Used by GestureSystem so the person can remember which gestures are set up.',
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
        story: 'Default display with 5 mappings. Each pill shows the gesture emoji plus the action name.',
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
        story: 'Compact variant with reduced padding and font size. Used by GestureSystem in the corner of the screen.',
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
        story: 'Only one mapping set up. The rest may have no gesture assigned.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => ({
    setup() {
      return () =>
        h('div', { style: { padding: '16px', fontFamily: 'system-ui, sans-serif', color: '#999' } }, [
          'No mapping is visible when every entry has gesture=None or action=none.',
        ]);
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Nothing is rendered when every entry has gesture `None` or action `none`. The component simply does not appear — empty on purpose.',
      },
    },
  },
};
