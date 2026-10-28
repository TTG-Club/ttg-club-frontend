<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import { ruleLinkSchema, RULES_SECTION } from '../model';
  import RuleEntry from './RuleEntry.vue';
</script>

<template>
  <SectionPage
    :section="RULES_SECTION"
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

    <template #entry="{ path }">
      <RuleEntry :path="path" />
    </template>
  </SectionPage>
</template>
