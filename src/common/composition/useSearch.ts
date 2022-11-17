import {
    computed, ref, unref
} from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { MaybeRef } from '@vueuse/core';

export type SearchConfig = {
    initial?: string
    exact?: MaybeRef<boolean>
}

export type SearchComposable = {
    value: Ref<string>
    exact: ComputedRef<boolean>
    updateSearch: (newValue: string) => string
}

export function useSearch(config?: SearchConfig): SearchComposable {
    const value = ref(config?.initial || '');

    const updateSearch = (newValue: string) => {
        value.value = newValue;

        return value.value;
    };

    return {
        value,
        exact: computed(() => !!unref(config?.exact)),

        updateSearch
    };
}
