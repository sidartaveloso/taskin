import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { h } from 'vue';
import type { FaceTrackingDebugProps } from './FaceTrackingDebug.types';
import FaceTrackingDebug from './FaceTrackingDebug.vue';

/**
 * O painel e `position: absolute`: ele foi feito para ficar **sobre** a imagem
 * da camera, ancorado num canto dela. Renderizado solto, sai do fluxo, o
 * container da story colapsa para altura zero e o painel aparece cortado pelo
 * canvas — foi assim que ele estava na galeria.
 *
 * Por isso toda story o desenha dentro de uma superficie posicionada, do tamanho
 * aproximado de um quadro de webcam. A moldura nao e enfeite: e o contexto sem o
 * qual o componente nao tem como se posicionar.
 */
const emUmaSuperficie = (props: FaceTrackingDebugProps) => ({
  setup() {
    return () =>
      h(
        'div',
        {
          style: {
            position: 'relative',
            width: '480px',
            maxWidth: '100%',
            height: '360px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2f3640 0%, #1e2229 100%)',
            overflow: 'hidden',
          },
        },
        [
          h(
            'span',
            {
              style: {
                position: 'absolute',
                inset: '0',
                display: 'grid',
                placeItems: 'center',
                color: 'rgba(255, 255, 255, 0.35)',
                font: '13px/1.4 system-ui, sans-serif',
                letterSpacing: '0.04em',
              },
            },
            'imagem da camera',
          ),
          h(FaceTrackingDebug, props),
        ],
      );
  },
});

const meta = {
  title: 'Molecules/Sense/FaceTrackingDebug',
  component: FaceTrackingDebug,
  tags: ['autodocs', 'ui-sense'],
  parameters: {
    docs: {
      description: {
        component:
          'Overlay panel that prints face-tracking values on top of the camera image. Every story renders it inside a stand-in camera surface, because the panel is absolutely positioned and has nothing to anchor to on its own.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Debug data to display',
    },
    title: {
      control: 'text',
      description: 'Title of the debug panel',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: 'Position of the debug panel',
    },
  },
} satisfies Meta<typeof FaceTrackingDebug>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockDebugData = {
  smile: '0.75',
  frown: '0.12',
  mouthOpen: '0.45',
  eyesWide: false,
  eyeLook: {
    x: '+0.123456789012345',
    y: '-0.098765432109876',
  },
  eyeOpenness: {
    left: '+0.8765432109',
    right: '+0.9012345678',
  },
};

export const Default: Story = {
  args: {
    data: mockDebugData,
    title: 'Debug Info',
    position: 'top-right',
  },
  render: (args) => emUmaSuperficie(args),
};

export const TopLeft: Story = {
  args: {
    data: mockDebugData,
    title: 'Face Tracking',
    position: 'top-left',
  },
  render: (args) => emUmaSuperficie(args),
};

export const BottomRight: Story = {
  args: {
    data: mockDebugData,
    title: 'BlendShapes',
    position: 'bottom-right',
  },
  render: (args) => emUmaSuperficie(args),
};

export const NoData: Story = {
  args: {
    data: null,
    title: 'Debug Info',
    position: 'top-right',
  },
  render: (args) => emUmaSuperficie(args),
  parameters: {
    docs: {
      description: {
        story:
          'Sem dados o painel nao aparece — o `v-if` some com ele inteiro, em vez de deixar uma caixa vazia sobre a imagem. A superficie continua ali para mostrar que o que sumiu foi o painel, e nao a story.',
      },
    },
  },
};
