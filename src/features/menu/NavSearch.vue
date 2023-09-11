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

<script setup lang="ts">
  import { onKeyStroke, useActiveElement } from '@vueuse/core';
  import { storeToRefs } from 'pinia';

  import NavPopover from '@/features/menu/NavPopover.vue';

  import { useNavStore } from '@/shared/stores/NavStore';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';
  import SearchModal from '@/shared/ui/modals/SearchModal.vue';

  const navStore = useNavStore();
  const { isShowSearch } = storeToRefs(navStore);

  const onOpenSearch = () => {
    isShowSearch.value = true;
  };

  onKeyStroke(['/', '\\', 'Find'], e => {
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
