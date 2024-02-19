<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount, ref, watch } from 'vue';

  import { useUserStore } from '@/shared/stores/UserStore';
  import SvgIcon from '@/shared/ui/icons/SvgIcon.vue';

  import CustomBookmarks from '@/features/bookmarks/components/CustomBookmarks.vue';
  import DefaultBookmarks from '@/features/bookmarks/components/DefaultBookmarks.vue';
  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
  import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';
  import NavPopover from '@/features/menu/NavPopover.vue';

  const opened = ref(false);
  const userStore = useUserStore();
  const { isAuthenticated } = storeToRefs(userStore);
  const defaultBookmarkStore = useDefaultBookmarkStore();
  const customBookmarkStore = useCustomBookmarkStore();

  const bookmarkIcon = computed(() => {
    const { bookmarks } = storeToRefs(
      isAuthenticated.value ? customBookmarkStore : defaultBookmarkStore,
    );

    return `bookmark/${bookmarks.value.length > 0 ? 'filled' : 'outline'}`;
  });

  const clickHandler = async () => {
    if (!opened.value) {
      await userStore.getUserStatus();
    }

    opened.value = !opened.value;
  };

  const restoreBookmarks = async () => {
    if (isAuthenticated.value) {
      await customBookmarkStore.queryGetBookmarks();

      return;
    }

    await defaultBookmarkStore.restoreBookmarks();
  };

  onBeforeMount(async () => {
    await restoreBookmarks();
  });

  watch(isAuthenticated, async () => {
    await restoreBookmarks();
  });
</script>

<template>
  <nav-popover
    v-model="opened"
    inner-scroll
  >
    <template #trigger="{ isActive }">
      <div
        :class="{ 'is-active': isActive }"
        class="navbar__btn"
        @click.left.exact.prevent="clickHandler"
      >
        <svg-icon :icon="bookmarkIcon" />
      </div>
    </template>

    <template #default>
      <div class="nav-bookmarks">
        <default-bookmarks v-if="!isAuthenticated" />

        <custom-bookmarks v-else />
      </div>
    </template>
  </nav-popover>
</template>

<style lang="scss">
  @use '@/assets/styles/modules/bookmarks';

  .nav-bookmarks {
    display: flex;
    height: 100%;
    overflow: hidden;
  }
</style>
