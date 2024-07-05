<script lang="ts" setup>
  import { useClassName } from '@/shared/composable/useClassName';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import { useDiceHistory } from '@/features/dice-history/composables';

  const cn = useClassName();
  const { toggle, isOpen } = useDiceHistory();
</script>

<template>
  <nav-popover>
    <template #trigger>
      <div
        class="navbar__btn"
        :class="[cn(), isOpen && 'is-active']"
        @click="toggle"
      >
        <svg-icon :icon="isOpen ? 'close' : 'dice/d20'" />
      </div>
    </template>
  </nav-popover>
</template>

<style lang="scss" module>
  @use '@/assets/styles/variables/breakpoints' as *;

  .nav-dice-history-button {
    @include media-min($md) {
      display: none !important;
    }
  }
</style>
