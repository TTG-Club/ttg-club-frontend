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
        reference: setReference
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

<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { computed, onBeforeMount } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { useFilter } from '@/shared/composition/useFilter';
  import { usePagination } from '@/shared/composition/usePagination';
  import { useScrollToPathInList } from '@/shared/composition/useScrollToPathInList';
  import { isAutoOpenAvailable } from '@/shared/helpers/isAutoOpenAvailable';
  import type { AnyObject } from '@/shared/types/Utility';

  import ContentLayout from '@/components/content/ContentLayout.vue';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import { getListProps } from '@/components/list/VirtualList/helpers';

  import { BooksFilterDefaults } from '@/types/Wiki/Books.d';

  import { useUIStore } from '@/store/UI/UIStore';
  import BookLink from '@/views/Wiki/Books/BookLink.vue';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const { isMobile, fullscreen } = storeToRefs(uiStore);

  const filter = useFilter({
    dbName: BooksFilterDefaults.dbName,
    url: BooksFilterDefaults.url
  });

  const {
    initPages,
    nextPage,
    isEnd,
    items: books
  } = usePagination({
    url: '/books',
    search: filter.search,
    order: [
      {
        field: 'year',
        direction: 'asc'
      },
      {
        field: 'name',
        direction: 'asc'
      }
    ]
  });

  const getBookGroup = (book: AnyObject & { type: AnyObject }) => ({
    url: book.type.name,
    name: book.type.name,
    order: book.type.order
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
    showRightSide
  });
</script>
