<script setup lang="ts" generic="T">
  import type { z } from 'zod';

  import type { RouteLocationRaw } from 'vue-router';

  import type { SectionConfig } from '../model';

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
    section,
    schema,
    getKey,
    getGroup = undefined,
    getPath = undefined,
  } = defineProps<{
    /** Заголовок, ручки, сортировка и размер страницы раздела. */
    section: SectionConfig;
    schema: z.ZodType<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    /** Адрес записи на сайте; без него строки списка никуда не ведут. */
    getPath?: (item: T) => string;
  }>();

  defineSlots<{
    /** Строка списка; `to` ведёт к записи с текущими поиском и фильтром. */
    item: (props: { item: T; to?: RouteLocationRaw }) => unknown;
  }>();

  const route = useRoute();
  const { input, term } = useSectionSearch();

  // Ручка фильтра у раздела не меняется, поэтому условный вызов безопасен
  const filter = section.filterUrl
    ? await useSectionFilter(section.key, section.filterUrl)
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

  // Запись открыта, когда сработал дочерний маршрут раздела
  const isDetailOpen = computed(() => route.matched.length > 1);

  /**
   * Ссылка на запись: поиск и фильтр списка переходят вместе с ней.
   * @param item - запись списка
   */
  function getLink(item: T): RouteLocationRaw | undefined {
    return getPath ? { path: getPath(item), query: route.query } : undefined;
  }

  function retry() {
    return refresh();
  }
</script>

<template>
  <SectionLayout
    :title="section.title"
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
