<script lang="ts" setup>
  import BottomRightWindow from '@/shared/ui/BottomRightWindow.vue';
  import UiFab from '@/shared/ui/kit/button/UiFab.vue';

  import { useDiceHistory } from '../composables';

  import DiceHistoryWindowContent from './DiceHistoryWindowContent.vue';

  const { isOpen, toggle } = useDiceHistory();
</script>

<template>
  <transition name="popover-animation">
    <bottom-right-window v-if="isOpen">
      <dice-history-window-content />
    </bottom-right-window>
  </transition>

  <ui-fab
    :icon="isOpen ? 'close' : 'dice/d20'"
    @click="toggle()"
  />
</template>

<style lang="scss" scoped>
  .popover-animation {
    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: scale(0);
    }

    &-enter-to,
    &-leave-from {
      opacity: 1;
      transform: scale(1);
    }

    &-enter-active,
    &-leave-active {
      @include css_anim;
    }
  }
</style>
