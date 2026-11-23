<script setup lang="ts">
  import type { ScreenLink } from '../model';

  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getScreenGroup,
    getScreenGroupOrder,
    getScreenSubgroup,
    screenLinkSchema,
    SCREENS_SECTION,
    sortScreenSubgroups,
  } from '../model';
  import ScreenEntry from './ScreenEntry.vue';
  import ScreenLinkCard from './ScreenLinkCard.vue';

  // Тип задан явно: иначе список выводит тип записи из общей сортировки
  const sortItems: (items: Array<ScreenLink>) => Array<ScreenLink> =
    sortScreenSubgroups;
</script>

<template>
  <!--
    Вложенные разделы справочника плитками, сгруппированные по корневым
    разделам в их порядке, внутри — по подгруппам, как на старом сайте;
    запись открывается как в остальных разделах.
  -->
  <SectionPage
    :section="SCREENS_SECTION"
    :schema="screenLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getScreenGroup"
    :get-group-order="getScreenGroupOrder"
    :get-subgroup="getScreenSubgroup"
    :sort-items="sortItems"
    :get-path="getEntryUrl"
  >
    <template #item="{ item }">
      <ScreenLinkCard :screen="item" />
    </template>

    <template #entry="{ path }">
      <ScreenEntry :path="path" />
    </template>
  </SectionPage>
</template>
