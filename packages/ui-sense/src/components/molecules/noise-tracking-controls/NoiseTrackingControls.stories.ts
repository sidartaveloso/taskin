import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { reactive } from 'vue';
import NoiseTrackingControls from './NoiseTrackingControls.vue';

const meta = {
  title: 'Molecules/NoiseTrackingControls',
  component: NoiseTrackingControls,
  tags: ['autodocs'],
  argTypes: {
    isActive: { control: { type: 'boolean' }, description: 'Se o watcher esta ouvindo' },
    error: { control: 'text', description: 'Falha do microfone' },
    disabled: { control: 'boolean', description: 'Trava o botao de iniciar/parar' },
    noiseThreshold: { control: { type: 'range', min: 0, max: 0.2, step: 0.001 } },
    enableNoiseReactions: { control: { type: 'boolean' } },
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

export const Default: Story = {};

/** Ouvindo: o indicador pulsa ao lado do botao, nao solto no fim da barra. */
export const Listening: Story = {
  args: {
    isActive: true,
    enableNoiseReactions: true,
    noiseSound: true,
  },
};

/** Microfone negado: a cor fica na borda e o texto continua legivel. */
export const WithError: Story = {
  args: {
    error: 'Microfone indisponivel. Verifique as permissoes do navegador.',
    disabled: true,
  },
};

/**
 * Com um pai de verdade: o componente e controlado, entao sem alguem escutando
 * os eventos o slider e as caixas nao se mexem.
 */
export const Interactive: Story = {
  args: {
    isActive: false,
    enableNoiseReactions: false,
    noiseThreshold: 0.06,
    noiseDebounceMs: 1500,
    noiseSound: false,
  },
  render: (args) => ({
    components: { NoiseTrackingControls },
    setup() {
      const state = reactive({ ...args });

      return { state };
    },
    template: `
      <NoiseTrackingControls
        v-bind="state"
        @toggle-noise="state.isActive = !state.isActive"
        @update:enableNoiseReactions="state.enableNoiseReactions = $event"
        @update:noiseThreshold="state.noiseThreshold = $event"
        @update:noiseDebounceMs="state.noiseDebounceMs = $event"
        @update:noiseSound="state.noiseSound = $event"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole('button');
    await expect(button).toHaveTextContent('Start Noise Watcher');
    await expect(canvas.queryByText('Listening for noise...')).toBeNull();

    await fireEvent.click(button);

    await waitFor(async () => {
      await expect(button).toHaveTextContent('Stop Noise Watcher');
      await expect(canvas.getByText('Listening for noise...')).toBeTruthy();
    });

    /*
     * O valor mostrado tem tres casas fixas de proposito: com o passo de 0.001
     * o texto mudaria de largura a cada arrasto, empurrando o resto da linha.
     */
    const slider = canvas.getByRole('slider') as HTMLInputElement;
    slider.value = '0.12';
    await fireEvent.input(slider);

    await waitFor(async () => {
      await expect(canvas.getByText('0.120')).toBeTruthy();
    });

    const reactions = canvas.getByLabelText('Enable') as HTMLInputElement;
    await expect(reactions.checked).toBe(false);
    await fireEvent.click(reactions);

    await waitFor(async () => {
      await expect(reactions.checked).toBe(true);
    });
  },
};
