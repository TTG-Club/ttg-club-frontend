<script setup lang="ts" generic="T">
  import type { z } from 'zod';

  import type { RouteLocationRaw } from 'vue-router';

  import type { SectionOrder } from '../model';

  import {
    useSectionFilter,
    useSectionList,
    useSectionSearch,
  } from '../composables';
  import { SectionControls } from '../controls';
  import { SectionLayout } from '../layout';
  import { SectionList } from '../list';

  /**
   * Страница раздела целиком: поиск, фильтр, список с подгрузкой и панель
   * открытой записи из дочернего маршрута. Раздел задаёт только ручки,
   * проверку записей и вид строки списка.
   */
  const {
    sectionKey,
    title,
    listUrl,
    filterUrl = undefined,
    order = undefined,
    schema,
    getKey,
    getGroup = undefined,
    getPath,
  } = defineProps<{
    /** Ключ раздела для данных SSR. */
    sectionKey: string;
    title: string;
    listUrl: string;
    /** Ручка фильтра; без неё у раздела только поиск. */
    filterUrl?: string;
    order?: Array<SectionOrder>;
    schema: z.ZodType<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    /** Адрес записи на сайте. */
    getPath: (item: T) => string;
  }>();

  defineSlots<{
    /** Строка списка; `to` ведёт к записи с текущими поиском и фильтром. */
    item: (props: { item: T; to: RouteLocationRaw }) => unknown;
  }>();

  const route = useRoute();
  const { input, term } = useSectionSearch();

  // Ручка фильтра у раздела не меняется, поэтому условный вызов безопасен
  const filter = filterUrl
    ? await useSectionFilter(sectionKey, filterUrl)
    : undefined;

  const filterPayload = computed(() => filter?.payload.value);

  const { items, status, isEnd, isLoadingMore, refresh, loadMore } =
    await useSectionList({
      key: sectionKey,
      url: listUrl,
      schema,
      order,
      search: term,
      filter: filterPayload,
    });

  // Запись открыта, когда сработал дочерний маршрут раздела
  const isDetailOpen = computed(() => route.matched.length > 1);

  /**
   * Ссылка на запись: поиск и фильтр списка переходят вместе с ней.
   * @param item - запись списка
   */
  function getLink(item: T): RouteLocationRaw {
    return { path: getPath(item), query: route.query };
  }

  function retry() {
    return refresh();
  }
</script>

<template>
  <SectionLayout
    :title="title"
    :is-detail-open="isDetailOpen"
  >
    <template #controls>
      <SectionControls
        v-model:search="input"
        :definition="filter?.definition.value"
        :selection="filter?.selection.value ?? {}"
        :is-customized="filter?.isCustomized.value"
        @update:selection="filter?.setSelection($event)"
        @reset="filter?.reset()"
      />
    </template>

    <SectionList
      :items="items"
      :get-key="getKey"
      :get-group="getGroup"
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
          :to="getLink(item)"
        />
      </template>
    </SectionList>

    <template #detail>
      <NuxtPage />
    </template>
  </SectionLayout>
</template>
