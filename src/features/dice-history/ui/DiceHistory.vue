<script lang="ts" setup>
  import { useClassName } from '@/shared/composables/useClassName';
  import BottomRightWindow from '@/shared/ui/BottomRightWindow.vue';
  import UiFab from '@/shared/ui/kit/button/UiFab.vue';

  import { useDiceHistory } from '../composables';

  import DiceHistoryWindowContent from './DiceHistoryWindowContent.vue';

  const cn = useClassName();

  const { isOpen, toggle } = useDiceHistory();
</script>

<template>
  <bottom-right-window
    :open="isOpen"
    :class="cn('window')"
  >
    <dice-history-window-content />
  </bottom-right-window>

  <ui-fab
    :icon="isOpen ? 'close' : 'dice/d20'"
    @click="toggle"
  />
</template>
