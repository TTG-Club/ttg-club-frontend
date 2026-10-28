<script setup lang="ts">
  import type { ItemLink, ItemsGrouping } from '../model';

  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getItemCategoryGroups,
    getItemCategoryOrder,
    isItemsGrouping,
    itemLinkSchema,
    ITEMS_GROUPING_COOKIE,
    ITEMS_GROUPING_COOKIE_MAX_AGE_SECONDS,
    ITEMS_GROUPING_DEFAULT,
    ITEMS_GROUPING_OPTIONS,
    ITEMS_SECTION,
  } from '../model';
  import ItemEntry from './ItemEntry.vue';

  const cookie = useCookie<string>(ITEMS_GROUPING_COOKIE, {
    maxAge: ITEMS_GROUPING_COOKIE_MAX_AGE_SECONDS,
    default: () => ITEMS_GROUPING_DEFAULT,
  });

  // Из cookie может прийти что угодно: неизвестное значение не принимаем
  const grouping = computed({
    get: (): ItemsGrouping =>
      isItemsGrouping(cookie.value) ? cookie.value : ITEMS_GROUPING_DEFAULT,
    set: (value: string) => {
      if (isItemsGrouping(value)) {
        cookie.value = value;
      }
    },
  });

  const isByCategory = computed(() => grouping.value === 'category');

  // Типы заданы явно: SectionPage выводит тип записи из пропсов
  const getGroup = computed<(item: ItemLink) => string | Array<string>>(() =>
    isByCategory.value ? getItemCategoryGroups : getFirstLetterGroup,
  );

  const getGroupOrder = computed<
    ((item: ItemLink, group: string) => number) | undefined
  >(() => (isByCategory.value ? getItemCategoryOrder : undefined));
</script>

<template>
  <!-- Снаряжение по категориям или по первой букве названия -->
  <SectionPage
    v-model:grouping="grouping"
    :section="ITEMS_SECTION"
    :schema="itemLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroup"
    :get-group-order="getGroupOrder"
    :get-path="getEntryUrl"
    :grouping-options="ITEMS_GROUPING_OPTIONS"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
        :source="item.source"
      />
    </template>

    <template #entry="{ path }">
      <ItemEntry :path="path" />
    </template>
  </SectionPage>
</template>
