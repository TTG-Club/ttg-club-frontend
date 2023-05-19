<template>
  <ui-button
    v-if="groups?.length"
    ref="trigger"
    :tooltip="{ content: 'Добавить в закладки', hideOnClick: true }"
    icon="bookmark"
    type="text"
    split
    :before-dropdown-show="onBeforeOpen"
  >
    <template #dropdown>
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

<script>
  import {
    computed, defineComponent, ref, toRefs
  } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'vue-toastification';
  import { useCustomBookmarkStore } from '@/store/UI/bookmarks/CustomBookmarksStore';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
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

      const inProgress = ref(false);

      const onBeforeOpen = async () => {
        await bookmarksStore.queryGetBookmarks();
      };

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

      return {
        submenu,
        trigger,
        bookmarkName,
        isSaved,
        groups,
        savedGroups,
        onBeforeOpen,
        updateBookmark
      };
    }
  });
</script>
