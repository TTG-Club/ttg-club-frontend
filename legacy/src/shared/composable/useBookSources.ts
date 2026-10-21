import { httpClient } from '@/shared/api';
import type { IBookLink } from '@/shared/types/wiki/Books';
import { errorHandler } from '@/shared/utils/errorHandler';

/**
 * Список книг для выбора источника в редакторах мастерской.
 *
 * Значением служит аббревиатура книги (`MM`) — по ней бэкенд и ищет источник.
 * Пустое значение означает, что при создании подставится книга самодельного
 * контента, а при редактировании источник останется прежним.
 */
export const useBookSources = (initial?: string) => {
  const books = ref<Array<IBookLink>>([]);
  const source = ref<string | null>(initial || null);

  const sourceOptions = computed(() =>
    books.value.map((book) => ({
      label: `${book.name.rus} [${book.source.shortName}]`,
      value: book.source.shortName,
    })),
  );

  const loadBooks = async () => {
    try {
      const resp = await httpClient.post<Array<IBookLink>>({
        url: '/books',
        payload: {
          page: 0,
          size: -1,
          order: [{ field: 'name', direction: 'asc' }],
        },
      });

      books.value = resp.data;
    } catch (err) {
      errorHandler(err);
    }
  };

  onBeforeMount(loadBooks);

  return {
    source,
    sourceOptions,
  };
};
