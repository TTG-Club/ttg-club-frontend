<script setup lang="ts">
  import { useNavPopover } from '@/shared/composable/useNavPopover';
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import SearchModal from '@/pages/search/SearchModal.vue';

  const { isShowSearch } = useNavPopover();

  const onOpenSearch = () => {
    isShowSearch.value = true;
  };

  onKeyStroke(['/', '\\', 'Find'], (e) => {
    const activeElement = useActiveElement();

    if (
      activeElement.value?.tagName === 'INPUT' ||
      activeElement.value?.tagName === 'TEXTAREA'
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onOpenSearch();
  });
</script>

<template>
  <nav-popover>
    <template #trigger="{ isActive }">
      <div
        :class="{ 'is-active': isActive }"
        class="navbar__btn"
        @click.left.exact.prevent="isShowSearch = !isShowSearch"
      >
        <svg-icon icon="search" />
      </div>
    </template>
  </nav-popover>

  <search-modal v-model="isShowSearch" />
</template>
