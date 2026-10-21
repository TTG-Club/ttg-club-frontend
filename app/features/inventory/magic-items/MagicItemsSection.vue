<script setup lang="ts">
  import { SectionLink } from '~section/list';
  import { getEntryUrl } from '~section/model';
  import { SectionPage } from '~section/page';

  import {
    getRarityGroup,
    MAGIC_ITEM_TEXT,
    MAGIC_ITEMS_SECTION,
    magicItemLinkSchema,
  } from '../model';
  import MagicItemRarity from './MagicItemRarity.vue';
</script>

<template>
  <!-- Предметы сгруппированы по редкости; «Н» — нужна настройка -->
  <SectionPage
    :section="MAGIC_ITEMS_SECTION"
    :schema="magicItemLinkSchema"
    :get-key="getEntryUrl"
    :get-group="getRarityGroup"
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
          <MagicItemRarity
            :rarity="item.rarity"
            class="shrink-0"
          />

          <UTooltip
            v-if="item.customization"
            :text="MAGIC_ITEM_TEXT.attunementHint"
          >
            <span
              class="flex size-5 shrink-0 items-center justify-center rounded-md border border-default bg-elevated text-xs"
            >
              {{ MAGIC_ITEM_TEXT.attunementShort }}
            </span>
          </UTooltip>
        </template>
      </SectionLink>
    </template>
  </SectionPage>
</template>
