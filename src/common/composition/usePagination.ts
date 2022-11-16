import {
    computed, ref, unref
} from 'vue';
import type { MaybeRef } from '@vueuse/core';
import type { FilterQueryParams } from '@/common/composition/useFilter';
import { useIsDev } from '@/common/helpers/isDev';
import errorHandler from '@/common/helpers/errorHandler';
import { useAxios } from '@/common/composition/useAxios';
import type { RequestConfig } from '@/common/services/HTTPService';

export type PaginationSearch = {
    value: MaybeRef<string>
    exact: MaybeRef<boolean>
}

export type PaginationOrder = Array<{
    field: string
    direction: 'asc' | 'desc'
}>

export type PaginationQuery = {
    page?: number

    /**
     * -1 для получения всего списка
     */
    limit?: number
    filter?: FilterQueryParams
    search?: PaginationSearch,
    order?: PaginationOrder
}

export type PaginationFilter = {
    isCustomized: MaybeRef<boolean>
    value: MaybeRef<FilterQueryParams>
}

export type PaginationConfig = {
    url: MaybeRef<string>
    page?: MaybeRef<number>
    limit?: MaybeRef<number>
    search?: MaybeRef<PaginationSearch>
    order?: MaybeRef<PaginationOrder>
    filter?: MaybeRef<PaginationFilter>
}

export default function usePagination(config: PaginationConfig) {
    let abortController: AbortController | null;

    const http = useAxios();
    const isDev = useIsDev();

    const isLoading = ref(false);
    const isFirstLoad = ref(true);

    const items = ref<Array<any>>([]);
    const page = ref(unref(config.page) || 0);
    const limit = computed(() => unref(config.limit) || 70);
    const isEnd = ref(false);

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

        if (filter && unref(filter.isCustomized)) {
            request.filter = unref(filter.value);
        }

        return request;
    });

    const abort = () => {
        if (abortController) abortController.abort();
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

            const resp = await http.post(apiConfig);

            if (nextPage) {
                items.value.push(...resp.data);
            }

            if (!nextPage) {
                items.value = resp.data;
            }

            isEnd.value = limit.value === -1 || (Array.isArray(items.value) && (items.value.length < limit.value));

            return Promise.resolve();
        } catch (err: any) {
            if (err.message === 'canceled') return Promise.resolve();

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

        const result = await load();

        isFirstLoad.value = false;

        return Promise.resolve(result);
    };

    const nextPage = async () => {
        if (isEnd.value) {
            return;
        }

        page.value++;

        await load(true);
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
        nextPage
    };
}
