<script lang="ts" setup>
  import { useDiceHistory } from '@/features/dice-history/composables';

  const { toggle, isOpen } = useDiceHistory();
</script>

<template>
  <div
    class="navbar__btn nav-dice-history-button"
    :class="{ 'is-active': isOpen }"
    @click="toggle"
  >
    <svg-icon :icon="isOpen ? 'close' : 'dice/d20'" />
  </div>
</template>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .nav-dice-history-button {
    @include media-min($md) {
      display: none;
    }
  }
</style>
