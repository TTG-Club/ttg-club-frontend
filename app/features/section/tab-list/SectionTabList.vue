<script setup lang="ts" generic="T">
  import type { z } from 'zod';

  import type { SectionConfig } from '../model';

  import {
    useLocalQueryStore,
    useSectionFilter,
    useSectionList,
    useSectionSearch,
  } from '../composables';
  import { SectionControls } from '../controls';
  import { SectionList } from '../list';

  /**
   * Список раздела внутри вкладки, как заклинания класса: свои поиск и
   * фильтр в памяти, а фильтр уходит в запрос всегда — его скрытая
   * группа выбирает класс.
   */
  const {
    section,
    schema,
    getKey,
    getGroup = undefined,
    getGroupOrder = undefined,
  } = defineProps<{
    /** Ключ должен быть свой у каждой вкладки: по нему кэшируются данные. */
    section: SectionConfig;
    schema: z.ZodType<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    /** Порядок группы записи; без него группы идут по первой записи. */
    getGroupOrder?: (item: T) => number;
  }>();

  defineSlots<{
    item: (props: { item: T }) => unknown;
  }>();

  const store = useLocalQueryStore();
  const { input, term } = useSectionSearch(store);

  // Ручка фильтра у вкладки не меняется, поэтому условный вызов безопасен
  const filter = section.filterUrl
    ? await useSectionFilter(section.key, section.filterUrl, {
        store,
        isAlwaysSent: true,
      })
    : undefined;

  const filterPayload = computed(() => filter?.payload.value);

  const { items, status, isEnd, isLoadingMore, refresh, loadMore } =
    await useSectionList({
      key: section.key,
      url: section.listUrl,
      schema,
      order: section.order,
      size: section.pageSize,
      search: term,
      filter: filterPayload,
    });

  function retry() {
    return refresh();
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionControls
      v-model:search="input"
      :definition="filter?.definition.value"
      :selection="filter?.selection.value ?? {}"
      :is-customized="filter?.isCustomized.value"
      @update:selection="filter?.setSelection($event)"
      @reset="filter?.reset($event)"
    />

    <SectionList
      :items="items"
      :get-key="getKey"
      :get-group="getGroup"
      :get-group-order="getGroupOrder"
      :status="status"
      :is-end="isEnd"
      :is-loading-more="isLoadingMore"
      @load-more="loadMore"
      @retry="retry"
    >
      <template #default="{ item }">
        <slot
          name="item"
          :item="item"
        />
      </template>
    </SectionList>
  </div>
</template>
