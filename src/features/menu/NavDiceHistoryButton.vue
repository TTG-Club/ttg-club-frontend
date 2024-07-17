<script lang="ts" setup>
  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import { useDiceHistory } from '@/features/dice-history/composables';
  import NavPopover from '@/features/menu/NavPopover.vue';

  const { toggle, isOpen } = useDiceHistory();
  const isShow = useAppBreakpoints().smaller('md');
</script>

<template>
  <nav-popover v-if="isShow">
    <template #trigger>
      <div
        class="navbar__btn"
        @click="toggle"
      >
        <svg-icon :icon="isOpen ? 'close' : 'dice/d20'" />
      </div>
    </template>
  </nav-popover>
</template>
