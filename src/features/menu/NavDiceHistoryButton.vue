<script lang="ts" setup>
  import { useClassName } from '@/shared/utils/className';

  import { useDiceHistory } from '@/features/dice-history/composables';

  const cn = useClassName();
  const { toggle, isOpen } = useDiceHistory();
</script>

<template>
  <div
    class="navbar__btn"
    :class="[cn(), isOpen && 'is-active']"
    @click="toggle"
  >
    <svg-icon :icon="isOpen ? 'close' : 'dice/d20'" />
  </div>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;

  .nav-dice-history-button {
    @include media-min($md) {
      display: none;
    }
  }
</style>
