<script setup lang="ts">
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getRaceGroup,
    raceLinkSchema,
    RACES_SECTION,
    sortRaces,
  } from '../model';
  import RaceCard from './RaceCard.vue';
</script>

<template>
  <!-- Расы карточками: сначала основные, затем группы по порядку -->
  <SectionPage
    :section="RACES_SECTION"
    :schema="raceLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getRaceGroup"
    :get-path="getEntryUrl"
    :sort-items="sortRaces"
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
