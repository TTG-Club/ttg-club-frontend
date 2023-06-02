<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    :on-load-more="nextPage"
    :is-end="isEnd"
    :items="books"
    virtualized
    title="Источники"
    @search="onSearch"
    @update="initPages"
  >
    <template #default="{ item: book }">
      <book-link
        v-if="book"
        :book="book"
        :to="{ path: book.url }"
      />
    </template>
  </content-layout>
</template>

<script setup lang="ts">
  import {
    computed, defineComponent, onBeforeMount
  } from 'vue';
  import sortBy from 'lodash/sortBy';
  import { storeToRefs } from 'pinia';
  import { useRoute, useRouter } from 'vue-router';
  import ContentLayout from '@/components/content/ContentLayout.vue';
  import BookLink from '@/views/Wiki/Books/BookLink.vue';
  import { useUIStore } from '@/store/UI/UIStore';
  import { useFilter } from '@/common/composition/useFilter';
  import { usePagination } from '@/common/composition/usePagination';
  import { BooksFilterDefaults } from '@/types/Wiki/Books.types';
  import { isAutoOpenAvailable } from '@/common/helpers/isAutoOpenAvailable';

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

  const onSearch = async () => {
    await initPages();

    if (isAutoOpenAvailable(books)) {
      await router.push({ path: books.value[0].list[0].url });
    }
  };

  onBeforeMount(async () => {
    await initPages();
  });

  const showRightSide = computed(() => route.name === 'bookDetail');
</script>
