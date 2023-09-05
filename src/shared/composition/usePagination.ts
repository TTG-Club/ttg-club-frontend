import { toValue } from '@vueuse/core';
import { computed, ref, unref } from 'vue';
import { useRoute } from 'vue-router';

import { useAxios } from '@/shared/composition/useAxios';
import type { FilterQueryParams } from '@/shared/composition/useFilter';
import { useMetrics } from '@/shared/composition/useMetrics';
import { DEFAULT_PAGINATION_ITEMS_LIMIT } from '@/shared/const';
import errorHandler from '@/shared/helpers/errorHandler';
import { useIsDev } from '@/shared/helpers/isDev';
import type { RequestConfig } from '@/shared/services/HTTPService';

import type { MaybeRefOrGetter, MaybeRef } from '@vueuse/core';

export type PaginationSearch = {
  value: MaybeRef<string>;
  exact: MaybeRef<boolean>;
};

export type PaginationOrder = Array<{
  field: string;
  direction: 'asc' | 'desc';
}>;

export type PaginationQuery = {
  page?: number;

  /**
   * -1 для получения всего списка
   */
  limit?: number;
  filter?: FilterQueryParams;
  search?: PaginationSearch;
  order?: PaginationOrder;
};

export type PaginationFilter = {
  isCustomized: MaybeRef<boolean> | MaybeRefOrGetter<boolean>;
  value: MaybeRef<FilterQueryParams> | MaybeRefOrGetter<FilterQueryParams>;
};

export type PaginationConfig = {
  url: MaybeRef<string>;
  page?: MaybeRef<number>;
  limit?: MaybeRef<number>;
  search?: MaybeRef<PaginationSearch>;
  order?: MaybeRef<PaginationOrder>;
  filter?: MaybeRef<PaginationFilter>;
};

export function usePagination<T>(config: PaginationConfig) {
  let abortController: AbortController | null;

  const route = useRoute();
  const http = useAxios();
  const isDev = useIsDev();
  const { sendPageViewMetrics } = useMetrics();

  const isLoading = ref(false);
  const isFirstLoad = ref(true);

  const items = ref<Array<any>>([]);
  const page = ref(unref(config.page) || 0);

  const limit = computed(
    () => unref(config.limit) || DEFAULT_PAGINATION_ITEMS_LIMIT
  );

  const isEnd = ref<boolean>(unref(config.limit) === -1 || true);

  const payload = computed((): PaginationQuery => {
    const request: PaginationQuery = {
      page: unref(page),
      limit: unref(limit)
    };

    const search = unref(config.search);

    if (search?.value) {
      request.search = {
        value: unref(search.value),
        exact: unref(search.exact)
      };
    }

    if (unref(config.order)?.length) {
      request.order = unref(config.order);
    }

    const filter = unref(config.filter);

    if (filter && toValue(filter.isCustomized)) {
      request.filter = toValue(filter.value);
    }

    return request;
  });

  const abort = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const load = async (nextPage = false): Promise<void> => {
    if (!config.url) {
      return Promise.resolve();
    }

    isLoading.value = true;

    abort();

    abortController = new AbortController();

    try {
      const apiConfig: RequestConfig = {
        url: unref(config.url),
        payload: unref(payload),
        signal: abortController.signal
      };

      const resp = await http.post<Array<T>>(apiConfig);

      if (nextPage) {
        items.value.push(...resp.data);
      }

      if (!nextPage) {
        items.value = resp.data;
      }

      isEnd.value =
        !(resp.data instanceof Array) || resp.data.length < limit.value;

      return Promise.resolve();
    } catch (err: any) {
      if (err.message === 'canceled') {
        return Promise.resolve();
      }

      if (isDev) {
        errorHandler(err);
      }

      return Promise.reject(err);
    } finally {
      isLoading.value = false;
      abortController = null;
    }
  };

  const initPages = async () => {
    page.value = 0;
    isEnd.value = true;

    const result = await load();

    isFirstLoad.value = false;

    return Promise.resolve(result);
  };

  const nextPage = async () => {
    if (limit.value === -1 || isEnd.value) {
      return;
    }

    page.value++;

    await load(true);

    sendPageViewMetrics(route);
  };

  const resetPages = () => {
    page.value = 0;
    isFirstLoad.value = true;
    items.value = [];
    isEnd.value = false;

    abortController = null;

    return Promise.resolve();
  };

  return {
    isLoading,
    isFirstLoad,
    isEnd,
    items,
    page,
    limit,
    payload,
    abort,
    initPages,
    nextPage,
    resetPages
  };
}
