import localforage from 'localforage';
import { cloneDeep } from 'lodash-es';
import { computed, ref, unref } from 'vue';

import { httpClient } from '@/shared/api';
import type {
  SearchComposable,
  SearchConfig,
} from '@/shared/composables/useSearch';
import { useSearch } from '@/shared/composables/useSearch';

import type { MaybeRef } from '@vueuse/core';
import type { ComputedRef, Ref } from 'vue';

export type FilterItem = {
  label: string;
  key: string;
  default: boolean;
  value?: boolean;
  tooltip?: string;
};

export type FilterGroup = {
  name: string;
  key: string;
  expand?: boolean;
  hidden?: boolean;
  type?: string;
  values: Array<FilterItem>;
};

export type Filter = {
  sources?: Array<FilterGroup>;
  other: Array<FilterGroup>;
};

export type FilterConfig = {
  url: MaybeRef<string>;
  search?: SearchConfig;
  dbName: MaybeRef<string>;
  storeKey?: MaybeRef<string | 'core'>;
};

export type FilterQueryParams = {
  [key: string]: Array<string>;
};

export type FilterComposable = {
  filter: Ref<Filter | Array<FilterGroup> | undefined>;
  search: SearchComposable;
  isCustomized: ComputedRef<boolean>;
  queryParams: ComputedRef<FilterQueryParams>;
  initFilter: () => Promise<void>;
  saveFilter: (filterEdited: Filter | Array<FilterGroup>) => Promise<void>;
  resetFilter: () => Promise<Filter | Array<FilterGroup> | undefined>;
};

export function useFilter(config: FilterConfig): FilterComposable {
  const filter = ref<Filter | Array<FilterGroup> | undefined>(undefined);

  const url = computed(() => unref(config.url));
  const dbName = computed(() => unref(config.dbName));
  const storeKey = computed(() => unref(config.storeKey) || 'core');
  const storeName = 'filters';

  const search = useSearch({
    initial: config.search?.initial || '',
    exact: !!config.search?.exact,
  });

  const store = ref<LocalForage>(
    localforage.createInstance({
      name: unref(dbName),
      storeName,
    }),
  );

  const setStoreInstance = () => {
    store.value = localforage.createInstance({
      name: unref(dbName),
      storeName,
    });
  };

  const isCustomized = computed(() => {
    if (!filter.value) {
      return false;
    }

    const isValuesCustomized = (values?: Array<FilterItem>) =>
      !!values?.some((item) => item.default !== item.value);

    const isGroupCustomized = (group: FilterGroup) =>
      isValuesCustomized(group.values);

    if (Array.isArray(filter.value)) {
      return filter.value.some((group) => isGroupCustomized(group));
    }

    return Object.values(filter.value).some((value) => {
      if (!Array.isArray(value)) {
        return false;
      }

      return value.some((group) => isGroupCustomized(group));
    });
  });

  const queryParams = computed(() => {
    const params: FilterQueryParams = {};

    if (!filter.value) {
      return params;
    }

    const setGroupToParams = (group: FilterGroup) => {
      params[group.key] = group.values
        .filter((val: FilterItem) => val.value)
        .map((val: FilterItem) => val.key);
    };

    if (Array.isArray(filter.value)) {
      for (const group of filter.value) {
        setGroupToParams(group);
      }
    }

    for (const [key, group] of Object.entries(filter.value)) {
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

  const getRestored = async (
    filterDefault: Filter | Array<FilterGroup>,
  ): Promise<Filter | Array<FilterGroup>> => {
    let restoredFilter: Filter | Array<FilterGroup>;
    let filterKey: keyof Filter;

    await store.value.ready();

    const copy = cloneDeep(filterDefault);

    const saved: Filter | Array<FilterGroup> | null = await store.value.getItem(
      unref(storeKey),
    );

    const copyIsNewType =
      (Array.isArray(copy) && !Array.isArray(saved)) ||
      (!Array.isArray(copy) && Array.isArray(saved));

    const getRestoredValue = (value: FilterItem, key: string) => {
      if (!saved || copyIsNewType) {
        return value.default;
      }

      let savedGroup: FilterGroup | undefined;

      if (Array.isArray(saved)) {
        savedGroup = saved.find((group) => group.key === key);
      }

      if (filterKey && !Array.isArray(saved)) {
        savedGroup = saved[filterKey as keyof Filter]!.find(
          (group) => group.key === key,
        );
      }

      if (!savedGroup) {
        return value.default;
      }

      const savedValue = savedGroup.values.find((val) => val.key === value.key);

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
          value: getRestoredValue(group.values[i], group.key),
        });
      }

      return {
        ...group,
        values,
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

    return Promise.resolve(restoredFilter);
  };

  const saveFilter = async (filterEdited: Filter | Array<FilterGroup>) => {
    await store.value.ready();

    filter.value = filterEdited;

    if (!isCustomized.value) {
      await store.value.removeItem(unref(storeKey));

      return Promise.resolve();
    }

    await store.value.setItem(unref(storeKey), cloneDeep(filterEdited));

    return Promise.resolve();
  };

  const resetFilter = async () => {
    await store.value.ready();

    if (!filter.value) {
      return Promise.resolve(filter.value);
    }

    const copy: Filter | Array<FilterGroup> = cloneDeep(filter.value);

    let initialFilter: Filter | Array<FilterGroup>;

    const getValueWithDefaults = (item: FilterItem): FilterItem => ({
      ...item,
      value: item.default,
    });

    const getGroupWithDefaults = (group: FilterGroup): FilterGroup => {
      const values = [];

      for (let i = 0; i < group.values.length; i++) {
        values.push(getValueWithDefaults(group.values[i]));
      }

      return {
        ...group,
        values,
      };
    };

    if (Array.isArray(copy)) {
      initialFilter = [];

      for (let i = 0; i < copy.length; i++) {
        initialFilter.push(getGroupWithDefaults(copy[i]));
      }

      await saveFilter(initialFilter);

      return Promise.resolve(initialFilter);
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

    return Promise.resolve(initialFilter);
  };

  const initFilter = async () => {
    try {
      const setStore = async (filterDefault: Filter | Array<FilterGroup>) => {
        const restored = await getRestored(filterDefault);

        if (!restored) {
          return;
        }

        filter.value = restored;

        await store.value.setItem(unref(storeKey), restored);
      };

      const resp = await httpClient.post<Filter | Array<FilterGroup>>({
        url: unref(url),
      });

      if (!resp.data || resp.status !== 200) {
        return Promise.reject();
      }

      setStoreInstance();
      search.value.value = config.search?.initial || '';

      await setStore(resp.data);

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  return {
    filter,
    search,

    isCustomized,
    queryParams,

    initFilter,
    saveFilter,
    resetFilter,
  };
}
