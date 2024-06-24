<script lang="ts" setup>
  import { SvgIcon } from '@/shared/ui/icons/svg-icon';
  import { toast } from '@/shared/utils/toast';

  import { useDefaultBookmarkStore } from '@/features/bookmarks/store/DefaultBookmarkStore';

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

  const route = useRoute();
  const bookmarkStore = useDefaultBookmarkStore();
  const inProgress = ref(false);

  const bookmarkUrl = computed(() =>
    props.url !== '' ? props.url : route.path,
  );

  const isSaved = computed(() =>
    bookmarkStore.isBookmarkSaved(bookmarkUrl.value),
  );

  const updateBookmark = async () => {
    if (inProgress.value) {
      return;
    }

    try {
      inProgress.value = true;

      const bookmark = await bookmarkStore.updateBookmark(
        bookmarkUrl.value,
        props.name,
      );

      toast.success(`Закладка ${bookmark ? 'добавлена' : 'удалена'}!`);
    } catch (err) {
      toast.error('Произошла какая-то ошибка...');
    } finally {
      inProgress.value = false;
    }
  };
</script>

<template>
  <n-tooltip>
    <template #trigger>
      <n-button
        :loading="inProgress"
        quaternary
        @click.left.exact.prevent.stop="updateBookmark"
      >
        <template #icon>
          <svg-icon :icon="`bookmark/${isSaved ? 'filled' : 'outline'}`" />
        </template>
      </n-button>
    </template>

    <template #default>
      {{ isSaved ? 'Удалить из закладок' : 'Добавить в закладки' }}
    </template>
  </n-tooltip>
</template>

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
