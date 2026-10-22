import type { MaybeRefOrGetter } from 'vue';

import {
  buildSearchRequest,
  EMPTY_SEARCH_RESPONSE,
  SEARCH_API_URL,
  searchResponseSchema,
} from '../model';

interface SiteSearchOptions {
  /** Ключ данных; к нему добавляются строка поиска и страница. */
  key: string;
  term: MaybeRefOrGetter<string>;
  /** Номер страницы с единицы. */
  page?: MaybeRefOrGetter<number>;
  size: number;
  /** Окну поиска запрос на сервере не нужен: оно открывается в браузере. */
  server?: boolean;
}

/**
 * Поиск по всему сайту. Пустая строка запроса не шлёт и сразу отдаёт пустой
 * ответ.
 * @param options - ключ, строка поиска, страница и размер страницы
 */
export function useSiteSearch(options: SiteSearchOptions) {
  const term = computed(() => toValue(options.term).trim());
  const page = computed(() => toValue(options.page) ?? 1);

  return useAsyncData(
    () => `${options.key}:${term.value}:${page.value}`,
    async () => {
      if (!term.value) {
        return EMPTY_SEARCH_RESPONSE;
      }

      return searchResponseSchema.parse(
        await $fetch(SEARCH_API_URL, {
          method: 'POST',
          body: buildSearchRequest(term.value, page.value, options.size),
        }),
      );
    },
    {
      deep: false,
      server: options.server ?? true,
      default: () => EMPTY_SEARCH_RESPONSE,
    },
  );
}
