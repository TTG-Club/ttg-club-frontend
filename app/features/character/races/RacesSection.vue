<script setup lang="ts">
  import type { RaceLink } from '../model';

  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    CHARACTER_LIST_SECTION_VIEW,
    getGroupName,
    raceLinkSchema,
    RACES_SECTION,
    sortByGroup,
  } from '../model';
  import RaceCard from './RaceCard.vue';
  import RaceEntry from './RaceEntry.vue';
  import RaceRowCard from './RaceRowCard.vue';

  const { isModern } = useCharacterListView();

  const listView = computed(() =>
    isModern.value
      ? CHARACTER_LIST_SECTION_VIEW.modern
      : CHARACTER_LIST_SECTION_VIEW.covers,
  );

  // Тип задан явно: иначе список выводит тип записи из общей сортировки
  const sortItems: (items: Array<RaceLink>) => Array<RaceLink> = sortByGroup;
</script>

<template>
  <!--
    Сначала основные расы, затем группы по порядку. Вид «Модерн» — строками,
    как в старом SPA, иначе обложками, как виды на new.ttg.club.
  -->
  <SectionPage
    :section="RACES_SECTION"
    :schema="raceLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getGroupName"
    :get-path="getEntryUrl"
    :sort-items="sortItems"
    :view="listView"
  >
    <template #item="{ item, to }">
      <RaceRowCard
        v-if="isModern"
        :race="item"
        :to="to"
      />

      <RaceCard
        v-else
        :race="item"
        :to="to"
      />
    </template>

    <template #entry="{ path }">
      <RaceEntry :path="path" />
    </template>
  </SectionPage>
</template>
