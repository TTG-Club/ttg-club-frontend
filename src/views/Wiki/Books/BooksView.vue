<template>
  <content-layout
    :filter-instance="filter"
    :show-right-side="showRightSide"
    title="Источники"
    @search="onSearch"
    @update="initPages"
    @list-end="nextPage"
  >
    <div
      v-for="(group, groupKey) in books"
      :key="groupKey"
      class="books-group"
    >
      <div class="books-group__name">
        {{ group.name }}
      </div>

      <div class="books-group__list">
        <book-link
          v-for="book in group.list"
          :key="book.url"
          :book="book"
          :to="{ path: book.url }"
        />
      </div>
    </div>
  </content-layout>
</template>

<script lang="ts">
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

  export default defineComponent({
    components: {
      BookLink,
      ContentLayout
    },
    setup() {
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
        items
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

      // TODO: Доделать типизацию
      const books = computed(() => {
        const bookList: any[] = [];
        const types: any[] = [];

        if (!items.value) {
          return bookList;
        }

        for (const book of items.value) {
          if (types.find(obj => obj.name === book.type.name)) {
            continue;
          }

          types.push(book.type);
        }

        for (const type of sortBy(types, [o => o.order])) {
          bookList.push({
            name: type.name,
            list: items.value.filter(book => book.type.name === type.name)
          });
        }

        return bookList;
      });

      const onSearch = async () => {
        await initPages();

        if (books.value.length === 1 && !isMobile.value) {
          await router.push({ path: books.value[0].list[0].url });
        }
      };

      onBeforeMount(async () => {
        await initPages();
      });

      return {
        isMobile,
        fullscreen,
        books,
        filter,
        showRightSide: computed(() => route.name === 'bookDetail'),
        initPages,
        nextPage,
        onSearch
      };
    }
  });
</script>
