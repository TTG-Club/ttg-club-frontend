<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    ARMOR_TEXT,
    armorLinkSchema,
    ARMORS_SECTION,
    getTypeGroup,
    getTypeOrder,
  } from '../model';
  import ArmorEntry from './ArmorEntry.vue';
</script>

<template>
  <!-- Доспехи сгруппированы по типу; во второй строке КД и цена -->
  <SectionPage
    :section="ARMORS_SECTION"
    :schema="armorLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getTypeGroup"
    :get-group-order="getTypeOrder"
    :get-path="getEntryUrl"
  >
    <template #item="{ item, to }">
      <SectionLink
        :to="to"
        :title="item.name.rus"
        :subtitle="item.name.eng"
        :source="item.source"
      >
        <template #details>
          <UTooltip
            v-if="item.armorClass"
            :text="ARMOR_TEXT.armorClassHint"
          >
            <span class="shrink-0">{{ item.armorClass }}</span>
          </UTooltip>

          <UTooltip
            v-if="item.price"
            :text="ARMOR_TEXT.price"
          >
            <span class="shrink-0 text-highlighted">{{ item.price }}</span>
          </UTooltip>
        </template>
      </SectionLink>
    </template>

    <template #entry="{ path }">
      <ArmorEntry :path="path" />
    </template>
  </SectionPage>
</template>
