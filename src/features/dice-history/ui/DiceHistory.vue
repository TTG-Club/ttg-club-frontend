<script lang="ts" setup>
  import UiFab from '@/shared/ui/kit/button/UiFab.vue';

  import { useDiceHistory } from '../composables';

  import DiceHistoryWindow from './DiceHistoryWindow.vue';
  import DiceHistoryWindowContent from './DiceHistoryWindowContent.vue';

  const { isOpen, toggle } = useDiceHistory();
</script>

<template>
  <div class="dice-history">
    <transition name="popover-animation">
      <dice-history-window v-show="isOpen">
        <dice-history-window-content />
      </dice-history-window>
    </transition>

    <ui-fab
      class="dice-history__fab"
      :icon="isOpen ? 'close' : 'dice/d20'"
      @click="toggle()"
    />
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;
  @use '@/assets/styles/variables/colors' as *;
  @use 'variables' as *;

  .dice-history {
    &__fab {
      position: fixed;
      right: $x-offset;
      bottom: $y-offset;
      z-index: 50;
    }
  }

  .popover-animation {
    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: scale(0);
      z-index: -1;
    }

    &-enter-to,
    &-leave-from {
      opacity: 1;
      transform: scale(1);
      z-index: 111;
    }

    &-enter-active,
    &-leave-active {
      @include css_anim;
    }
  }
</style>
