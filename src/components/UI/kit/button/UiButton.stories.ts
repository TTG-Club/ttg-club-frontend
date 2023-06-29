import type { Meta, StoryObj } from '@storybook/vue3';
import UiButton from '@/components/UI/kit/button/UiButton.vue';
import { icons } from '@/common/helpers/icons';

const meta: Meta<typeof UiButton> = {
  title: 'TTG-KIT/Buttons/Button',
  component: UiButton,
  args: {
    default: 'Button',
    type: 'default',
    size: 'md',
    color: 'primary',
    iconPosition: 'left',
    icon: undefined,
    disabled: false,
    loading: false,
    fullWidth: false,
    nativeType: 'button',
    split: false,
    tooltip: undefined,
    beforeDropdownShow: undefined,
    beforeDropdownHide: undefined
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'outline',
        'text'
      ]
    },
    size: {
      control: 'select',
      options: [
        'sm',
        'md',
        'lg'
      ]
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'success',
        'warning',
        'error',
        'info',
        'text'
      ]
    },
    nativeType: {
      control: 'select',
      options: [
        'button',
        'submit',
        'reset'
      ]
    },
    iconPosition: {
      control: 'radio',
      options: ['left', 'right']
    },
    icon: {
      control: 'select',
      options: icons
    },
    default: {
      control: 'text'
    }
  },
  render: args => ({
    setup: () => ({ args }),
    components: { UiButton },
    template: `
      <ui-button v-bind="args">
        <template v-slot:default>{{ args.default }}</template>
      </ui-button>
    `
  })
};

export default meta;

type Story = StoryObj<typeof UiButton>;

export const Simple: Story = {};

export const WithIcon: Story = {
  args: {
    icon: 'dice/d20'
  }
};

export const WithRightIcon: Story = {
  args: {
    icon: 'dice/d20',
    iconPosition: 'right'
  }
};

export const WithTooltip: Story = {
  args: {
    tooltip: {
      content: 'Tooltip'
    }
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Secondary: Story = {
  args: {
    type: 'secondary'
  }
};

export const Outline: Story = {
  args: {
    type: 'outline'
  }
};

export const Text: Story = {
  args: {
    type: 'text'
  }
};
