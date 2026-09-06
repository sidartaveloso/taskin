import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { reactive } from 'vue';
import TrackingControls from './TrackingControls.vue';

const meta = {
  title: 'Molecules/TrackingControls',
  component: TrackingControls,
  tags: ['autodocs'],
  argTypes: {
    isDetecting: {
      control: 'boolean',
      description: 'Whether tracking is currently detecting',
    },
    error: {
      control: 'text',
      description: 'Error message from tracking',
    },
    showWebcam: {
      control: 'boolean',
      description: 'Show webcam feed',
    },
    syncEyes: {
      control: 'boolean',
      description: 'Sync eyes with face tracking',
    },
    syncMouth: {
      control: 'boolean',
      description: 'Sync mouth with face tracking',
    },
    syncExpressions: {
      control: 'boolean',
      description: 'Sync expressions with face tracking',
    },
    syncArms: {
      control: 'boolean',
      description: 'Sync arms with pose tracking',
    },
    syncGestures: {
      control: 'boolean',
      description: 'Sync gesture recognition',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable start/stop button',
    },
  },
} satisfies Meta<typeof TrackingControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isDetecting: false,
    error: null,
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
};

export const Detecting: Story = {
  args: {
    isDetecting: true,
    error: null,
    showWebcam: true,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: true,
    syncGestures: true,
    disabled: false,
  },
};

export const WithError: Story = {
  args: {
    isDetecting: false,
    error: 'Falha ao acessar a webcam. Verifique as permissões.',
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: true,
  },
};

export const AllDisabled: Story = {
  args: {
    isDetecting: false,
    error: null,
    showWebcam: false,
    syncEyes: false,
    syncMouth: false,
    syncExpressions: false,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
};

/*
 * As stories acima sao estados congelados: o componente e controlado, entao
 * clicar num checkbox emite o evento e nada muda, porque nao ha quem escute.
 * As de baixo ligam o estado e verificam o comportamento.
 */

/** O componente com um pai de verdade: os controles respondem ao clique. */
export const Interactive: Story = {
  args: {
    isDetecting: false,
    error: null,
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
  render: (args) => ({
    components: { TrackingControls },
    setup() {
      const state = reactive({ ...args });

      return { state };
    },
    template: `
      <TrackingControls
        v-bind="state"
        @toggle-tracking="state.isDetecting = !state.isDetecting"
        @update:showWebcam="state.showWebcam = $event"
        @update:syncEyes="state.syncEyes = $event"
        @update:syncMouth="state.syncMouth = $event"
        @update:syncExpressions="state.syncExpressions = $event"
        @update:syncArms="state.syncArms = $event"
        @update:syncGestures="state.syncGestures = $event"
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // O rotulo do botao e o unico sinal de que o toggle chegou ao pai
    const button = canvas.getByRole('button');
    await expect(button).toHaveTextContent('Iniciar Detecção');
    await expect(canvas.queryByText('Detectando...')).toBeNull();

    await fireEvent.click(button);

    await waitFor(async () => {
      await expect(button).toHaveTextContent('Parar Detecção');
      await expect(canvas.getByText('Detectando...')).toBeTruthy();
    });

    // Um checkbox marcado por padrao desmarca, e um desmarcado marca: cobre os
    // dois sentidos do `update:`, que sao caminhos distintos no template
    const eyes = canvas.getByLabelText('Sincronizar Olhos') as HTMLInputElement;
    const arms = canvas.getByLabelText('Sincronizar Braços') as HTMLInputElement;
    await expect(eyes.checked).toBe(true);
    await expect(arms.checked).toBe(false);

    await fireEvent.click(eyes);
    await fireEvent.click(arms);

    await waitFor(async () => {
      await expect(eyes.checked).toBe(false);
      await expect(arms.checked).toBe(true);
    });
  },
};

/** `disabled` trava o botao sem esconder os checkboxes. */
export const DisabledButtonKeepsCheckboxes: Story = {
  args: {
    ...AllDisabled.args,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button')).toBeDisabled();
    // Os checkboxes nao seguem o `disabled` — e proposital, e vale ficar visivel
    await expect(canvas.getByLabelText('Mostrar Webcam')).toBeEnabled();
  },
};

/** Como o `TaskinWithFaceTracking` monta: rosto sim, pose e gestos nao. */
export const FaceTrackingOnly: Story = {
  args: {
    isDetecting: true,
    error: null,
    showWebcam: true,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    syncGestures: false,
    disabled: false,
  },
};

/** Como o `TaskinWithFullTracking` monta: rosto e braços, sem expressões. */
export const FullTracking: Story = {
  args: {
    isDetecting: true,
    error: null,
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: false,
    syncArms: true,
    syncGestures: false,
    disabled: false,
  },
};
