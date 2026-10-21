<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import { getSpellGroup, spellLinkSchema, SPELLS_SECTION } from '../model';
  import SpellLevel from './SpellLevel.vue';
  import SpellLinkDetails from './SpellLinkDetails.vue';
</script>

<template>
  <!-- Заклинания сгруппированы по кругу и грузятся постранично -->
  <SectionPage
    :section="SPELLS_SECTION"
    :schema="spellLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getSpellGroup"
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
          <SpellLevel :level="item.level" />
        </template>

        <template #details>
          <SpellLinkDetails :spell="item" />
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
