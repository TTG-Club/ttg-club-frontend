import { computed, ref } from 'vue';
import localforage from 'localforage';
import cloneDeep from 'lodash/cloneDeep';
import errorHandler from '@/common/helpers/errorHandler';
import { useAxios } from '@/common/composition/useAxios';
import type {
    Filter, FilterComposable, FilterGroup, FilterItem, FilterOptions, FilterQueryParams
} from '@/common/composition/types/filter';

export function useFilter(): FilterComposable {
    const http = useAxios();
    const filter = ref<Filter | Array<FilterGroup> | undefined>(undefined);
    const search = ref<string>('');
    const storeKey = ref<string>('filters');

    const store = ref<LocalForage>(localforage.createInstance({
        name: 'default',
        storeName: 'filters'
    }));

    const isCustomized = computed(() => {
        if (!filter.value) {
            return false;
        }

        const isValuesCustomized = (values?: Array<FilterItem>) => !!values
            ?.some(item => item.default !== item.value);

        const isGroupCustomized = (group: FilterGroup) => isValuesCustomized(group.values);

        if (Array.isArray(filter.value)) {
            return filter.value.some(group => isGroupCustomized(group));
        }

        return Object.values(filter.value).some(value => {
            if (!Array.isArray(value)) {
                return false;
            }

            return value.some(group => isGroupCustomized(group));
        });
    });

    const queryParams = computed(() => {
        const params: FilterQueryParams = {};

        const setGroupToParams = (group: FilterGroup) => {
            params[group.key] = group.values
                .filter((val: FilterItem) => val.value)
                .map((val: FilterItem) => val.key);
        };

        if (Array.isArray(filter.value)) {
            for (const group of filter.value as Array<FilterGroup>) {
                setGroupToParams(group);
            }
        }

        for (const entry of Object.entries(filter.value as Filter)) {
            const [key, group] = entry;

            if (key === 'sources') {
                params.book = [];

                for (const block of group) {
                    for (const book of block.values) {
                        if (book.value) {
                            params.book.push(book.key);
                        }
                    }
                }

                continue;
            }

            if (key === 'other') {
                for (const groupItem of group) {
                    setGroupToParams(groupItem);
                }
            }
        }

        return params;
    });

    const getRestored = async (filterDefault: Filter | Array<FilterGroup>): Promise<Filter | Array<FilterGroup>> => {
        let restoredFilter: Filter | Array<FilterGroup>;
        let filterKey: keyof Filter;

        await store.value.ready();

        const copy = cloneDeep(filterDefault);
        const saved: Filter | Array<FilterGroup> | null = await store.value.getItem(storeKey.value);

        if (!saved) {
            return copy;
        }

        const copyIsNewType = (Array.isArray(copy) && !Array.isArray(saved))
            || (!Array.isArray(copy) && Array.isArray(saved));

        const getRestoredValue = (value: FilterItem, key: string) => {
            if (copyIsNewType) {
                return value.default;
            }

            let savedGroup: FilterGroup | undefined;

            if (Array.isArray(saved)) {
                savedGroup = saved.find(group => group.key === key);
            }

            if (filterKey && !Array.isArray(saved)) {
                savedGroup = saved[filterKey as keyof Filter]!.find(group => group.key === key);
            }

            if (!savedGroup) {
                return value.default;
            }

            const savedValue = savedGroup.values.find(val => val.key === value.key);

            if (!savedValue) {
                return value.default;
            }

            return savedValue.value;
        };

        const getRestoredGroup = (group: FilterGroup) => {
            const values = [];

            for (let i = 0; i < group.values.length; i++) {
                values.push({
                    ...group.values[i],
                    value: getRestoredValue(group.values[i], group.key)
                });
            }

            return {
                ...group,
                values
            };
        };

        if (Array.isArray(copy)) {
            restoredFilter = [];

            for (let i = 0; i < copy.length; i++) {
                restoredFilter.push(getRestoredGroup(copy[i]));
            }

            return restoredFilter;
        }

        restoredFilter = {} as Filter;

        const entries = Object.entries(copy);

        for (let i = 0; i < entries.length; i++) {
            const [key, groups] = entries[i];

            filterKey = key as keyof Filter;
            restoredFilter[key as keyof Filter] = [];

            for (let j = 0; j < groups.length; j++) {
                restoredFilter[key as keyof Filter]!.push(getRestoredGroup(groups[j]));
            }
        }

        return restoredFilter;
    };

    const saveFilter = async (filterEdited: Filter | Array<FilterGroup>) => {
        await store.value.ready();

        filter.value = filterEdited;

        if (!isCustomized.value) {
            await store.value.removeItem(storeKey.value);

            return;
        }

        await store.value.setItem(storeKey.value, cloneDeep(filterEdited));
    };

    const resetFilter = async () => {
        await store.value.ready();

        if (!filter.value) {
            return filter.value;
        }

        const copy: Filter | Array<FilterGroup> = cloneDeep(filter.value);

        let initialFilter: Filter | Array<FilterGroup>;

        const getValueWithDefaults = (item: FilterItem): FilterItem => ({
            ...item,
            value: item.default
        });

        const getGroupWithDefaults = (group: FilterGroup): FilterGroup => {
            const values = [];

            for (let i = 0; i < group.values.length; i++) {
                values.push(getValueWithDefaults(group.values[i]));
            }

            return {
                ...group,
                values
            };
        };

        if (Array.isArray(copy)) {
            initialFilter = [];

            for (let i = 0; i < copy.length; i++) {
                initialFilter.push(getGroupWithDefaults(copy[i]));
            }

            await saveFilter(initialFilter);

            return initialFilter;
        }

        initialFilter = {} as Filter;

        const keys = Object.keys(copy as Filter) as Array<keyof Filter>;

        for (let i = 0; i < keys.length; i++) {
            initialFilter[keys[i] as keyof Filter] = [];

            for (let j = 0; j < copy[keys[i]]!.length; j++) {
                initialFilter[keys[i]]!.push(getGroupWithDefaults(copy[keys[i]]![j]));
            }
        }

        await saveFilter(initialFilter);

        return initialFilter;
    };

    const initFilter = async (options?: FilterOptions) => {
        const opts = {
            dbName: undefined,
            url: undefined,
            storeName: 'filters',
            storeKey: 'core',
            ...options
        };

        try {
            storeKey.value = opts.storeKey;

            store.value = localforage.createInstance({
                name: opts.dbName,
                storeName: opts.storeName
            });

            const setStore = async (filterDefault: Filter | Array<FilterGroup>) => {
                const restored = await getRestored(filterDefault);

                if (!restored) {
                    return;
                }

                filter.value = restored;

                await store.value.setItem(storeKey.value, restored);
            };

            const resp = await http.post(opts.url);

            if (!resp.data || resp.status !== 200) {
                return;
            }

            await setStore(resp.data);
        } catch (err) {
            errorHandler(err);
        }
    };

    const updateSearch = (searchStr = ''): string => {
        search.value = searchStr;

        return search.value;
    };

    return {
        filter,
        search,

        isCustomized,
        queryParams,

        initFilter,
        saveFilter,
        resetFilter,
        updateSearch
    };
}
