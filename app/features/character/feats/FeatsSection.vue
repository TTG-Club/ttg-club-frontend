<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl, getFirstLetterGroup } from '~section/model';
  import { SectionPage } from '~section/page';

  import { featLinkSchema, FEATS_SECTION } from '../model';
</script>

<template>
  <!-- Черты сгруппированы по первой букве; требования — во второй строке -->
  <SectionPage
    :section="FEATS_SECTION"
    :schema="featLinkSchema"
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
      >
        <template
          v-if="item.requirements"
          #details
        >
          <span class="min-w-0 truncate">{{ item.requirements }}</span>
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
