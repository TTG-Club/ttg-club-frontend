<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    BESTIARY_SECTION,
    creatureLinkSchema,
    getChallengeRatingGroup,
  } from '../model';
  import CreatureRating from './CreatureRating.vue';
</script>

<template>
  <!-- Существа сгруппированы по уровню опасности и грузятся постранично -->
  <SectionPage
    :section="BESTIARY_SECTION"
    :schema="creatureLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getChallengeRatingGroup"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
        :source="item.source"
      >
        <template #leading>
          <CreatureRating :rating="item.challengeRating" />
        </template>

        <template #details>
          <span class="shrink-0 first-letter:uppercase">{{ item.type }}</span>
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
