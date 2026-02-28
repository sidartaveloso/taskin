import type { Preview } from '@storybook/vue3-vite';
import './preview.css'; // Import global styles

const preview: Preview = {
  parameters: {
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
          { value: 'light', title: 'Light', left: '⚪' },
          { value: 'dark', title: 'Dark', left: '⚫' },
          { value: 'gray', title: 'Gray', left: '🔘' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
