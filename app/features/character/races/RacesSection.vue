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

  // Тип задан явно: иначе список выводит тип записи из общей сортировки
  const sortItems: (items: Array<RaceLink>) => Array<RaceLink> = sortByGroup;
</script>

<template>
  <!-- Расы карточками: сначала основные, затем группы по порядку -->
  <SectionPage
    :section="RACES_SECTION"
    :schema="raceLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroupName"
    :get-path="getEntryUrl"
    :sort-items="sortItems"
    is-grid
  >
    <template #item="{ item, to }">
      <RaceCard
        :race="item"
        :to="to"
      />
    </template>
  </SectionPage>
</template>
