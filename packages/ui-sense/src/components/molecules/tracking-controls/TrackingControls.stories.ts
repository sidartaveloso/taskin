import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { reactive } from 'vue';
import { TRACKING_CONTROLS } from './TrackingControls.types';
import TrackingControls from './TrackingControls.vue';

const meta = {
  title: 'Molecules/Sense/TrackingControls',
  component: TrackingControls,
  tags: ['autodocs', 'ui-sense'],
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
    disabled: {
      control: 'boolean',
      description: 'Disable start/stop button',
    },
    controls: {
      control: 'check',
      options: [...TRACKING_CONTROLS],
      description: 'Quais controles a tela implementa — obrigatorio, sem default',
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
    controls: [...TRACKING_CONTROLS],
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
    controls: [...TRACKING_CONTROLS],
    disabled: false,
  },
};

export const WithError: Story = {
  args: {
    isDetecting: false,
    error: 'Could not access the webcam. Check your permissions.',
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    syncArms: false,
    controls: [...TRACKING_CONTROLS],
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
    controls: [...TRACKING_CONTROLS],
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
    controls: [...TRACKING_CONTROLS],
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
      />
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // O rotulo do botao e o unico sinal de que o toggle chegou ao pai
    const button = canvas.getByRole('button');
    await expect(button).toHaveTextContent('Start Detection');
    await expect(canvas.queryByText('Detecting...')).toBeNull();

    await fireEvent.click(button);

    await waitFor(async () => {
      await expect(button).toHaveTextContent('Stop Detection');
      await expect(canvas.getByText('Detecting...')).toBeTruthy();
    });

    /*
     * O nome acessivel e so "Olhos": o verbo vive na legenda do grupo, e um
     * leitor de tela anuncia "Sincronizar, grupo" antes do item. Um checkbox
     * marcado por padrao desmarca e um desmarcado marca, cobrindo os dois
     * sentidos do `update:`, que sao caminhos distintos no template.
     */
    const eyes = canvas.getByLabelText('Eyes') as HTMLInputElement;
    const arms = canvas.getByLabelText('Arms') as HTMLInputElement;
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
    await expect(canvas.getByLabelText('Webcam')).toBeEnabled();
  },
};

/**
 * Como o `TaskinWithFaceTracking` monta: a tela nao tem pose nem gestos, entao
 * esses controles nem aparecem — antes apareciam como interruptores que nao
 * ligavam nada.
 */
export const FaceTrackingOnly: Story = {
  args: {
    controls: ['webcam', 'eyes', 'mouth', 'expressions'],
    isDetecting: true,
    error: null,
    showWebcam: true,
    syncEyes: true,
    syncMouth: true,
    syncExpressions: true,
    disabled: false,
  },
};

/** How `TaskinWithFullTracking` wires it: face and arms, no expressions or gestures. */
export const FullTracking: Story = {
  args: {
    controls: ['webcam', 'eyes', 'mouth', 'arms'],
    isDetecting: true,
    error: null,
    showWebcam: false,
    syncEyes: true,
    syncMouth: true,
    syncArms: true,
    disabled: false,
  },
};

/** So o essencial: uma tela que apenas liga e desliga o rastreamento de olhos. */
export const SingleControl: Story = {
  args: {
    controls: ['eyes'],
    isDetecting: false,
    error: null,
    syncEyes: true,
    disabled: false,
  },
};
