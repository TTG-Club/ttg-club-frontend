import { ref } from 'vue';
import type { Ref } from 'vue';

export type SearchConfig = {
    initial?: string
    exact?: boolean
}

export type SearchComposable = {
    value: Ref<string>
    exact: Ref<boolean>
    updateSearch: (newValue: string) => string
}

export function useSearch(config?: SearchConfig): SearchComposable {
    const value = ref(config?.initial || '');
    const exact = ref(!!config?.exact);

    const updateSearch = (newValue: string) => {
        value.value = newValue;

        return value.value;
    };

    return {
        value,
        exact,

        updateSearch
    };
}
