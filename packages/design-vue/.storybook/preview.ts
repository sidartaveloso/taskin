import type { Preview } from '@storybook/vue3-vite';
import './preview.css'; // Import global styles

// A CSS do ui-sense e um artefato separado do JS. Nos testes unitarios o
// `vitest.config.ts` faz alias do pacote para o fonte, entao os `<style scoped>`
// compilam inline e tudo aparece estilizado. No Storybook nao ha esse alias: o
// pacote resolve para `dist/index.js`, e sem este import os componentes do
// ui-sense (TrackingControls, NoiseTrackingControls, WebcamVideo) renderizam
// crus — botao sem estilo, checkbox nativo, fieldset pelado. Parecia
// implementacao propria de controle; era falta da folha de estilos.
import '@opentask/ui-sense/style.css';
import { initAnalytics } from './analytics';

// A galeria e publicada em /components/ e compartilha o projeto PostHog com a
// landing. O `taskin_surface` separa os eventos dos dois nos dashboards.
initAnalytics('components');

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Templates', 'Pages', 'Composables'],
      },
    },

    // Actions configuration
    actions: { argTypesRegex: '^on[A-Z].*' },

    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true, // Expand controls by default
      sort: 'requiredFirst', // Sort required props first
    },

    // Layout configuration
    // Center components by default
    layout: 'centered',

    // Docs configuration
    docs: {
      toc: true, // Enable table of contents
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  // Global decorators
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem;"><story /></div>',
    }),
  ],

  // Global tags
  tags: ['autodocs'],

  // Globals API - replaces deprecated backgrounds/viewport in parameters
  initialGlobals: {
    background: 'light',
  },

  globalTypes: {
    background: {
      description: 'Global background color',
      toolbar: {
        title: 'Background',
        icon: 'photo',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'gray', title: 'Gray' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
