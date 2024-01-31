<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';

  import { ToastEventBus } from '@/core/configs/ToastConfig';

  import UiButton from '@/shared/ui/kit/button/UiButton.vue';

  import { useCustomBookmarkStore } from '@/features/bookmarks/store/CustomBookmarksStore';
  import type { IBookmarkGroup } from '@/features/bookmarks/types/Bookmark.d';

  const props = withDefaults(
    defineProps<{
      name?: string;
      url?: string;
    }>(),
    {
      name: '',
      url: '',
    },
  );

  const toast = useToast(ToastEventBus);
  const bookmarksStore = useCustomBookmarkStore();
  const route = useRoute();

  const bookmarkUrl = computed(() =>
    props.url !== '' ? props.url : route.path,
  );

  const groups = computed(() =>
    bookmarksStore.getGroups.filter((group) => group.order > -1),
  );

  const isSaved = (uuid?: IBookmarkGroup['uuid']) =>
    uuid
      ? bookmarksStore.isBookmarkSavedInGroup(bookmarkUrl.value, uuid)
      : !!bookmarksStore.isBookmarkSavedInDefault(bookmarkUrl.value);

  const onOpenDropdown = () => bookmarksStore.queryGetBookmarks();

  const inProgress = ref(false);

  const updateBookmark = async (groupUUID?: IBookmarkGroup['uuid']) => {
    if (inProgress.value) {
      return;
    }

    const updateInGroup = (uuid: IBookmarkGroup['uuid']) =>
      bookmarksStore.updateBookmarkInGroup({
        url: bookmarkUrl.value,
        name: props.name,
        groupUUID: uuid,
      });

    const updateInDefault = async () => {
      const defaultGroup = await bookmarksStore.getDefaultGroup();

      return bookmarksStore.updateBookmarkInGroup({
        url: bookmarkUrl.value,
        name: props.name,
        groupUUID: defaultGroup.uuid,
      });
    };

    try {
      inProgress.value = true;

      const bookmark = groupUUID
        ? await updateInGroup(groupUUID)
        : await updateInDefault();

      toast.success(`Закладка ${bookmark ? 'добавлена' : 'удалена'}!`);
    } catch (err) {
      toast.error('Произошла какая-то ошибка...');
    } finally {
      inProgress.value = false;
    }
  };
</script>

<template>
  <ui-button
    :tooltip="{
      content: isSaved() ? 'Удалить из закладок' : 'Добавить в закладки',
      hideOnClick: true,
    }"
    :icon="`bookmark/${isSaved() ? 'filled' : 'outline'}`"
    :before-dropdown-show="onOpenDropdown"
    :loading="inProgress"
    type="text"
    split
    @click.left.exact.prevent="updateBookmark()"
  >
    <template
      v-if="groups?.length"
      #dropdown
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
    </template>
  </ui-button>
</template>

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
