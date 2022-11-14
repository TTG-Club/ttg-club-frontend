import type { ComputedRef, Ref } from 'vue';

export type FilterItem = {
    label: string
    key: string
    default: boolean
    value?: boolean
    tooltip?: string
}

export type FilterGroup = {
    name: string
    key: string
    expand?: boolean
    hidden?: boolean
    type?: string
    values: Array<FilterItem>
}

export type Filter = {
    sources?: Array<FilterGroup>
    other: Array<FilterGroup>
}

export type FilterOptions = {
    url: string
    dbName: string
    storeName?: string | 'filters'
    storeKey?: string | 'core'
}

export type FilterQueryParams = {
    [key: string]: Array<string>
}

export type FilterComposable = {
    filter: Ref<Filter | Array<FilterGroup> | undefined>
    search: Ref<string>
    isCustomized: ComputedRef<boolean>
    queryParams: ComputedRef<FilterQueryParams>
    initFilter: (options: FilterOptions) => Promise<void>
    saveFilter: (filterEdited: Filter | Array<FilterGroup>) => Promise<void>
    resetFilter: () => Promise<Filter | Array<FilterGroup> | undefined>
    updateSearch: (searchStr: string) => string
}

export declare function useFilter(): FilterComposable;
