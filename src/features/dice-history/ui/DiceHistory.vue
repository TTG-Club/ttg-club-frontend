<script lang="ts" setup>
  import BottomRightWindow from '@/shared/ui/BottomRightWindow.vue';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useDiceHistory } from '../composables';

  import DiceHistoryWindowContent from './DiceHistoryWindowContent.vue';

  const { isOpen, toggle, isFloatButtonVisible } = useDiceHistory();
</script>

<template>
  <bottom-right-window :open="isOpen">
    <dice-history-window-content />
  </bottom-right-window>

  <n-float-button
    v-if="isFloatButtonVisible"
    position="fixed"
    right="16"
    bottom="24"
    @click.left.exact.prevent="toggle"
  >
    <svg-icon
      :icon="isOpen ? 'close' : 'dice/d20'"
      size="24"
    />
  </n-float-button>
</template>
