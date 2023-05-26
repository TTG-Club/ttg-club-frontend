<template>
  <ui-button
    :icon="`bookmark/${isSaved ? 'filled' : 'outline'}`"
    :tooltip="{ content: isSaved ? 'Удалить из закладок' : 'Добавить в закладки' }"
    :loading="inProgress"
    type="text"
    @click.left.exact.prevent.stop="updateBookmark"
    @dblclick.prevent.stop
  />
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router';
  import { computed, ref } from 'vue';
  import { toast } from '@/common/helpers/toast';
  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';
  import { useUserStore } from '@/store/UI/UserStore';

  const props = withDefaults(defineProps<{
    name?: string;
    url?: string;
  }>(), {
    name: '',
    url: ''
  });

  const route = useRoute();
  const userStore = useUserStore();
  const bookmarkStore = useDefaultBookmarkStore();
  const inProgress = ref(false);

  const bookmarkUrl = computed(() => (props.url !== '' ? props.url : route.path));
  const isSaved = computed(() => bookmarkStore.isBookmarkSaved(bookmarkUrl.value));

  const updateBookmark = async () => {
    if (inProgress.value) {
      return;
    }

    try {
      inProgress.value = true;

      const bookmark = await bookmarkStore.updateBookmark(bookmarkUrl.value, props.name);

      toast.success(`Закладка ${ bookmark ? 'добавлена' : 'удалена' }!`);
    } catch (err) {
      toast.error('Произошла какая-то ошибка...');
    } finally {
      inProgress.value = false;
    }
  };
</script>

<style lang="scss" scoped>
    .default-bookmark-button {
        width: 28px;
        z-index: 1;

        &:hover {
            position: relative;
            z-index: 2;
        }
    }
</style>
