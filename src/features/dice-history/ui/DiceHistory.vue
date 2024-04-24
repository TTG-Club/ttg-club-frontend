<script lang="ts" setup>
  import BottomRightWindow from '@/shared/ui/BottomRightWindow.vue';
  import UiFab from '@/shared/ui/kit/button/UiFab.vue';

  import { useDiceHistory } from '../composables';

  import DiceHistoryWindowContent from './DiceHistoryWindowContent.vue';

  const { isOpen, toggle } = useDiceHistory();
</script>

<template>
  <bottom-right-window :open="isOpen">
    <dice-history-window-content />
  </bottom-right-window>

  <ui-fab
    :icon="isOpen ? 'close' : 'dice/d20'"
    @click="toggle"
  />
</template>
