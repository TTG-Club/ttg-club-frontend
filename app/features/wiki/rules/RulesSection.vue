<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { SectionPage } from '~section/page';

  import { getEntryUrl, ruleLinkSchema, RULES_SECTION } from '../model';
</script>

<template>
  <SectionPage
    :section-key="RULES_SECTION.key"
    :title="RULES_SECTION.title"
    :list-url="RULES_SECTION.listUrl"
    :filter-url="RULES_SECTION.filterUrl"
    :order="RULES_SECTION.order"
    :schema="ruleLinkSchema"
    :get-key="getEntryUrl"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
      />
    </template>
  </SectionPage>
</template>
