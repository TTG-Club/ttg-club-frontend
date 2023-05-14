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

<script>
  import {
    computed, defineComponent, ref, toRefs
  } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';
  import { onClickOutside } from '@vueuse/core';
  import errorHandler from '@/common/helpers/errorHandler';
  import { useCustomBookmarkStore } from '@/store/UI/bookmarks/CustomBookmarksStore';
  import UiButton from '@/components/UI/kit/UiButton.vue';
  import { ToastEventBus } from '@/common/utils/ToastConfig';

  export default defineComponent({
    components: {
      UiButton
    },
    props: {
      name: {
        type: String,
        default: ''
      },
      url: {
        type: String,
        default: ''
      }
    },
    setup(props) {
      const { name: bookmarkName } = toRefs(props);
      const toast = useToast(ToastEventBus);
      const bookmarksStore = useCustomBookmarkStore();
      const route = useRoute();

      const bookmarkUrl = computed(() => (
        typeof props.url === 'string' && props.url !== ''
          ? props.url
          : route.path
      ));

      const isOpen = ref(false);
      const bookmarks = ref([]);
      const groups = computed(() => bookmarksStore.getGroups.filter(group => group.order > -1));

      const savedGroups = computed(() => {
        const url = route.path;
        const saved = bookmarks.value.filter(item => item.url === url);

        return saved
          .map(item => bookmarks.value.find(bookmark => bookmark.uuid === item.parentUUID))
          .filter(item => !!item)
          .map(item => bookmarks.value.find(bookmark => bookmark.uuid === item.parentUUID))
          .filter(item => !!item);
      });

      const isSaved = uuid => bookmarksStore.isBookmarkSavedInGroup(bookmarkUrl.value, uuid);

      async function openSubmenu() {
        try {
          await bookmarksStore.queryGetBookmarks();

          isOpen.value = true;
        } catch (err) {
          errorHandler(err);
        }
      }

      function closeSubmenu() {
        isOpen.value = false;
      }

      async function toggleSubmenu() {
        if (isOpen.value) {
          closeSubmenu();

          return;
        }

        await openSubmenu();
      }

      const inProgress = ref(false);

      async function updateBookmark(groupUUID) {
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
      }

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

      return {
        submenu,
        trigger,
        bookmarkName,
        isOpen,
        isSaved,
        groups,
        savedGroups,
        toggleSubmenu,
        updateBookmark
      };
    }
  });
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
