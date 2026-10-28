import type { Preview } from '@storybook/react';
import '../src/tokens.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f7fb' },
        { name: 'dark', value: '#0f1420' }
      ]
    }
  }
};

export default preview;
