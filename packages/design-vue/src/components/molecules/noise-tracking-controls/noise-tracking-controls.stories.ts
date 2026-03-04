import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NoiseTrackingControls from './noise-tracking-controls.vue';

const meta = {
  title: 'Molecules/NoiseTrackingControls',
  component: NoiseTrackingControls,
  argTypes: {
    isActive: { control: { type: 'boolean' } },
    enableNoiseReactions: { control: { type: 'boolean' } },
    noiseThreshold: { control: { type: 'number' } },
    noiseDebounceMs: { control: { type: 'number' } },
    noiseSound: { control: { type: 'boolean' } },
  },
  args: {
    isActive: false,
    enableNoiseReactions: false,
    noiseThreshold: 0.06,
    noiseDebounceMs: 1500,
    noiseSound: false,
  },
} satisfies Meta<typeof NoiseTrackingControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args: any) => ({
    components: { NoiseTrackingControls },
    setup() {
      return { args };
    },
    template: `<div style="padding: 1rem;"><NoiseTrackingControls v-bind="args" /></div>`,
  }),
};
