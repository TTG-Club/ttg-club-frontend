<template>
  <div class="custom-bookmark-button__wrapper">
    <ui-button
      v-if="groups?.length"
      ref="trigger"
      v-tippy="{ content: 'Добавить в закладки', hideOnClick: true }"
      class="custom-bookmark-button"
      is-icon
      type-link-filled
      @click.left.exact.prevent.stop="toggleSubmenu"
    >
      <svg-icon
        :stroke-enable="false"
        fill-enable
        icon-name="arrow-2"
      />
    </ui-button>

    <div
      v-if="isOpen"
      ref="submenu"
      class="custom-bookmark-button__submenu"
    >
      <div
        v-for="(group, key) in groups"
        :key="key"
        :class="{ 'is-saved': isSaved(group.uuid) }"
        class="custom-bookmark-button__group"
        @click.left.exact.prevent="updateBookmark(group.uuid)"
        @dblclick.prevent.stop
      >
        {{ group.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';
  import { onClickOutside } from '@vueuse/core';
  import errorHandler from '@/common/helpers/errorHandler';
  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
  import UiButton from '@/components/UI/kit/UiButton.vue';
  import { ToastEventBus } from '@/common/utils/ToastConfig';
  import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
  import type { IBookmarkGroup } from '@/features/bookmarks/types/Bookmark.types';

  const props = withDefaults(defineProps<{
    name?: string;
    url?: string;
  }>(), {
    name: '',
    url: ''
  });

  const toast = useToast(ToastEventBus);
  const bookmarksStore = useCustomBookmarkStore();
  const route = useRoute();

  const bookmarkUrl = computed(() => (props.url !== '' ? props.url : route.path));

  const isOpen = ref(false);
  const groups = computed(() => bookmarksStore.getGroups.filter(group => group.order > -1));

  const isSaved = (uuid: IBookmarkGroup['uuid']) => bookmarksStore.isBookmarkSavedInGroup(bookmarkUrl.value, uuid);

  const openSubmenu = async () => {
    try {
      await bookmarksStore.queryGetBookmarks();

      isOpen.value = true;
    } catch (err) {
      errorHandler(err);
    }
  };

  const closeSubmenu = () => {
    isOpen.value = false;
  };

  const toggleSubmenu = async () => {
    if (isOpen.value) {
      closeSubmenu();

      return;
    }

    await openSubmenu();
  };

  const inProgress = ref(false);

  const updateBookmark = async (groupUUID: IBookmarkGroup['uuid']) => {
    if (inProgress.value) {
      return;
    }

    try {
      inProgress.value = true;

      const bookmark = await bookmarksStore.updateBookmarkInGroup({
        url: bookmarkUrl.value,
        name: props.name,
        groupUUID
      });

      toast.success(`Закладка ${ bookmark ? 'добавлена' : 'удалена' }!`);
    } catch (err) {
      toast.error('Произошла какая-то ошибка...');
    } finally {
      inProgress.value = false;
    }
  };

  const submenu = ref(null);
  const trigger = ref(null);

  onClickOutside(
    submenu,
    () => {
      isOpen.value = false;
    },
    {
      ignore: [trigger]
    }
  );
</script>

<style lang="scss" scoped>
    .custom-bookmark-button {
        z-index: 1;
        margin: 0 !important;
        width: 18px;

        &__wrapper {
            height: 100%;
            margin-left: -4px;
            position: relative;
        }

        &:hover {
            position: relative;
            z-index: 2;
        }

        &__submenu {
            position: absolute;
            background-color: var(--bg-sub-menu);
            padding: 8px;
            border-radius: 6px;
            box-shadow: 0 5px 30px #00000038;
            right: 0;
            z-index: 1;
            max-height: calc(16px + 30px * 4); // padding + 4 elements
            overflow: auto;
        }

        &__group {
            padding: 6px 6px;
            border-radius: 6px;
            cursor: pointer;
            min-width: 100px;
            max-width: 260px;
            white-space: nowrap;
            overflow: hidden;
            width: 100%;
            text-overflow: ellipsis;
            line-height: 18px;
            font-size: 14px;

            &.is-saved {
                background-color: var(--primary-select);
                position: relative;
                padding-left: 12px;

                &::before {
                    content: '';
                    width: 4px;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    position: absolute;
                    background-color: var(--primary);
                    display: block;
                }
            }

            &:hover {
                background-color: var(--hover);
            }

            & + & {
                margin-top: 4px;
            }
        }
    }
</style>
