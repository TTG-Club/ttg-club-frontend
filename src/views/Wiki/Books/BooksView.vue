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
      :grid="{ flat: checkIsListGridFlat({ showRightSide, fullscreen }), reference: setReference }"
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
  import { computed, onBeforeMount } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import BookLink from '@/views/Wiki/Books/BookLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { BooksFilterDefaults } from '@/types/Wiki/Books.types';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';
  import VirtualGroupedList from '@/components/list/VirtualGroupedList/VirtualGroupedList.vue';
  import type { AnyObject } from '@/types/Shared/Utility.types';
  import { getListProps } from '@/components/list/VirtualList/helpers';
  import { checkIsListGridFlat } from '@/components/list/VirtualGridList/helpers';
  import { useScrollToPathInList } from '@/common/composition/useScrollToPathInList';

  const route = useRoute();
  const router = useRouter();
  const uiStore = useUIStore();

  const {
    isMobile,
    fullscreen
  } = storeToRefs(uiStore);

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

  const { setReference } = useScrollToPathInList({ items: books });

  const getBookGroup = (book: AnyObject & {type: AnyObject}) => ({
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
</script>
