import type { Preview } from '@storybook/vue3-vite';

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
    layout: 'centered', // Center components by default

    // Backgrounds addon (built-in to Storybook 10)
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },

    // Viewport addon (built-in to Storybook 10)
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1920px', height: '1080px' },
        },
        tv: {
          name: 'TV Display',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },

    // Docs configuration (Storybook 10 feature)
    docs: {
      toc: true, // Enable table of contents
      story: {
        inline: true, // Render stories inline
      },
    },
  },

  // Global decorators
  decorators: [
    (story: any) => ({
      components: { story },
      template: '<div style="padding: 1rem;"><story /></div>',
    }),
  ],

  // Tags for all stories
  tags: ['autodocs'],
};

export default preview;
