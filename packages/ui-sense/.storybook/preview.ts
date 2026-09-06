import type { Preview } from '@storybook/vue3-vite';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['Atoms', 'Molecules', 'Organisms', 'Composables'],
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    layout: 'centered',

    /*
     * O axe roda e o resultado e descartado, igual ao design-vue. Ligar como
     * 'error' aqui exige a mesma decisao de paleta da task-042, entao fica
     * 'todo' ate la para nao quebrar as stories de uma vez.
     */
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
