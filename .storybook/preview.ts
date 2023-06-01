/// <reference types="vite-plugin-svg-icons/client" />
import 'virtual:svg-icons-register';
import 'vue-final-modal/style.css';
import "@/assets/styles/index.scss";
import type { Preview } from '@storybook/vue3';
import { withRootAttribute } from 'storybook-addon-root-attribute';

const preview: Preview = {
  decorators: [withRootAttribute],

  parameters: {
    layout: 'centered',
    docs: {
      source: { language: 'html' }
    },
    actions: {
      argTypesRegex: '^on[A-Z].*'
    },
    rootAttribute: {
      root: 'html',
      attribute: 'data-theme',
      defaultState: {
        name: 'Dark',
        value: 'theme-dark'
      },
      states: [
        {
          name: 'Light',
          value: 'theme-light'
        }
      ]
    }
  }
};

export default preview;
