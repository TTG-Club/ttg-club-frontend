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

  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import NavPopover from '@/components/UI/menu/NavPopover.vue';
  import SearchModal from '@/components/UI/modals/SearchModal.vue';

  import { useNavStore } from '@/store/UI/NavStore';

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
