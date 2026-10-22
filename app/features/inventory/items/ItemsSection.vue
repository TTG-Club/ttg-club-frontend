<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import { itemLinkSchema, ITEMS_SECTION } from '../model';
  import ItemEntry from './ItemEntry.vue';
</script>

<template>
  <!-- Снаряжение сгруппировано по первой букве названия -->
  <SectionPage
    :section="ITEMS_SECTION"
    :schema="itemLinkSchema"
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
      <ItemEntry :path="path" />
    </template>
  </SectionPage>
</template>
