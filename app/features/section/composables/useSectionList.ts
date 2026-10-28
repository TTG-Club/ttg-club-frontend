import type { Ref } from 'vue';

import type { FilterPayload, SectionOrder } from '../model';

import { z } from 'zod';

import {
  buildListRequest,
  SECTION_PAGE_SIZE,
  SECTION_PAGE_SIZE_ALL,
} from '../model';

interface SectionListOptions<T> {
  /** Ключ раздела для данных SSR. */
  key: string;
  /** Ручка списка, например `/api/v1/spells`. */
  url: string;
  /** Проверка записи списка. */
  schema: z.ZodType<T>;
  order?: Array<SectionOrder>;
  /**
   * Размер страницы; `SECTION_PAGE_SIZE_ALL` грузит весь раздел одним
   * запросом, как у коротких списков оружия и доспехов в старом SPA.
   */
  size?: number;
  search: Ref<string>;
  filter: Ref<FilterPayload | undefined>;
}

/**
 * Список раздела постранично: первая страница грузится на сервере,
 * следующие — при прокрутке. Поиск и фильтр перезапускают список.
 * @param options - ручка, проверка записей, сортировка, поиск и фильтр
 */
export async function useSectionList<T>(options: SectionListOptions<T>) {
  const listSchema = z.array(options.schema);
  const size = options.size ?? SECTION_PAGE_SIZE;

  /**
   * Проверяет, последняя ли это страница.
   * @param loaded - сколько записей пришло
   */
  function isLastPage(loaded: number): boolean {
    return size === SECTION_PAGE_SIZE_ALL || loaded < size;
  }

  /**
   * Загружает одну страницу списка.
   * @param page - номер страницы с нуля
   */
  async function fetchPage(page: number): Promise<Array<T>> {
    const response: unknown = await $fetch(options.url, {
      method: 'POST',
      body: buildListRequest({
        page,
        size,
        search: options.search.value,
        order: options.order,
        filter: options.filter.value,
      }),
    });

    return listSchema.parse(response);
  }

  // Строка, а не объекты: новый объект фильтра с тем же содержимым
  // не должен перезагружать список.
  const requestKey = computed(() =>
    JSON.stringify([options.search.value, options.filter.value]),
  );

  const {
    data: firstPage,
    status,
    error,
    refresh,
  } = await useAsyncData(`section-list-${options.key}`, () => fetchPage(0), {
    watch: [requestKey],
    deep: false,
  });

  const nextPages = shallowRef<Array<T>>([]);
  const page = ref(0);
  const isEnd = ref(false);
  const isLoadingMore = ref(false);

  // Номер выдачи: ответ следующей страницы для старого поиска не нужен.
  let generation = 0;

  watch(
    firstPage,
    (value) => {
      generation++;
      nextPages.value = [];
      page.value = 0;
      isEnd.value = isLastPage(value?.length ?? 0);
      isLoadingMore.value = false;
    },
    { immediate: true },
  );

  const items = computed(() => [
    ...(firstPage.value ?? []),
    ...nextPages.value,
  ]);

  async function loadMore() {
    if (isEnd.value || isLoadingMore.value || status.value !== 'success') {
      return;
    }

    const current = generation;

    isLoadingMore.value = true;

    try {
      const nextPage = page.value + 1;
      const loaded = await fetchPage(nextPage);

      if (current !== generation) {
        return;
      }

      page.value = nextPage;
      nextPages.value = [...nextPages.value, ...loaded];
      isEnd.value = isLastPage(loaded.length);
    } catch {
      if (current === generation) {
        isEnd.value = true;
      }
    } finally {
      if (current === generation) {
        isLoadingMore.value = false;
      }
    }
  }

  return { items, status, error, isEnd, isLoadingMore, refresh, loadMore };
}
