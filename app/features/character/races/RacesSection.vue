<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getGroupName,
    raceLinkSchema,
    RACES_SECTION,
    sortByGroup,
  } from '../model';
  import RaceCard from './RaceCard.vue';
  import RaceEntry from './RaceEntry.vue';

  // Тип задан явно: иначе список выводит тип записи из общей сортировки
  const sortItems: (items: Array<RaceLink>) => Array<RaceLink> = sortByGroup;
</script>

<template>
  <!-- Расы обложками, как виды на new.ttg.club: сначала основные, затем группы по порядку -->
  <SectionPage
    :section="RACES_SECTION"
    :schema="raceLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroupName"
    :get-path="getEntryUrl"
    :sort-items="sortItems"
    view="covers"
  >
    <template #item="{ item, to }">
      <RaceCard
        :race="item"
        :to="to"
      />
    </template>

    <template #entry="{ path }">
      <RaceEntry :path="path" />
    </template>
  </SectionPage>
</template>
