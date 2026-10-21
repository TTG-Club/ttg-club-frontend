<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import { optionLinkSchema, OPTIONS_SECTION } from '../model';
</script>

<template>
  <!-- Особенности сгруппированы по первой букве и грузятся постранично -->
  <SectionPage
    :section="OPTIONS_SECTION"
    :schema="optionLinkSchema"
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
  </SectionPage>
</template>
