<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composables/useFilter';
  import { usePagination } from '@/shared/composables/usePagination';
  import { useScrollToPathInList } from '@/shared/composables/useScrollToPathInList';
  import { useUIStore } from '@/shared/stores/UIStore';
  import type { AnyObject } from '@/shared/types/Utility';
  import { BooksFilterDefaults } from '@/shared/types/wiki/Books.d';
  import { checkIsListGridFlat } from '@/shared/ui/virtual-views/VirtualGridList/helpers';
  import VirtualGroupedList from '@/shared/ui/virtual-views/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/shared/ui/virtual-views/VirtualList/helpers';
  import { isAutoOpenAvailable } from '@/shared/utils/isAutoOpenAvailable';

  import ContentLayout from '@/layouts/ContentLayout.vue';

  import BookLink from '@/pages/wiki/books/BookLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: BooksFilterDefaults.dbName,
    url: BooksFilterDefaults.url,
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: books,
  } = usePagination({
    url: '/books',
    search: filter.search,
    order: [
      {
        field: 'year',
        direction: 'asc',
      },
      {
        field: 'name',
        direction: 'asc',
      },
    ],
  });

  const getBookGroup = (book: AnyObject & { type: AnyObject }) => ({
    url: book.type.name,
    name: book.type.name,
    order: book.type.order,
  });

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(books.value)) {
      await router.push({ path: books.value[0].url });
    }
  };

  onBeforeMount(async () => {
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'bookDetail');

  const { setReference } = useScrollToPathInList({
    items: books,
    showRightSide,
  });
</script>

<template>
  <content-layout
    :filter-instance="filter"
    :is-end="isEnd"
    :on-load-more="nextPage"
    :show-right-side="showRightSide"
    title="Источники"
    @search="onSearch"
    @update="initPages"
  >
    <virtual-grouped-list
      :get-group="getBookGroup"
      :list="getListProps({ items: books, size: 'small' })"
      :grid="{
        flat: checkIsListGridFlat({ showRightSide, fullscreen }),
        reference: setReference,
      }"
    >
      <template #default="{ item: book }">
        <book-link
          :book="book"
          :to="{ path: book.url }"
        />
      </template>
    </virtual-grouped-list>
  </content-layout>
</template>
