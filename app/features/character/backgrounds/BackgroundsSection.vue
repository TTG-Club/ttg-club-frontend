<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import { backgroundLinkSchema, BACKGROUNDS_SECTION } from '../model';
  import BackgroundEntry from './BackgroundEntry.vue';
</script>

<template>
  <!-- Предыстории сгруппированы по первой букве названия -->
  <SectionPage
    :section="BACKGROUNDS_SECTION"
    :schema="backgroundLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getFirstLetterGroup"
    :get-path="getEntryUrl"
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
      <BackgroundEntry :path="path" />
    </template>
  </SectionPage>
</template>
