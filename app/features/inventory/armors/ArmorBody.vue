<script setup lang="ts">
  import type { ArmorDetail } from '../model';

  import { ContentRender } from '~content/render';
  import { SectionSourceBar } from '~section/source-bar';
  import { SectionStat, SectionStatGrid } from '~section/stat-grid';

  import { ARMOR_TEXT, INVENTORY_EMPTY_VALUE } from '../model';

  /**
   * Карточка доспеха: КД, цена, вес, помеха на Скрытность, требование к
   * Силе, время надевания и описание.
   */
  const { armor } = defineProps<{
    armor: ArmorDetail;
  }>();

  const stealth = computed(() =>
    armor.disadvantage ? ARMOR_TEXT.yes : ARMOR_TEXT.no,
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <SectionSourceBar
      :left="armor.type.name"
      :source="armor.source"
    />

    <SectionStatGrid>
      <SectionStat :label="ARMOR_TEXT.armorClass">
        {{ armor.armorClass || INVENTORY_EMPTY_VALUE }}
      </SectionStat>

      <SectionStat :label="ARMOR_TEXT.price">
        {{ armor.price || INVENTORY_EMPTY_VALUE }}
      </SectionStat>

      <SectionStat :label="ARMOR_TEXT.weight">
        {{ armor.weight ?? INVENTORY_EMPTY_VALUE }}
      </SectionStat>

      <SectionStat :label="ARMOR_TEXT.stealth">
        {{ stealth }}
      </SectionStat>

      <SectionStat :label="ARMOR_TEXT.strength">
        {{ armor.requirement || ARMOR_TEXT.no }}
      </SectionStat>

      <SectionStat :label="ARMOR_TEXT.duration">
        {{ armor.duration || INVENTORY_EMPTY_VALUE }}
      </SectionStat>
    </SectionStatGrid>

    <ContentRender
      v-if="armor.description"
      :html="armor.description"
    />
  </div>
</template>
