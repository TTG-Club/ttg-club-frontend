<script setup lang="ts">
  import type { LootGroup, LootMagicItem } from '../model';

  import { noop } from 'es-toolkit';

  import { MagicItemRarity } from '~inventory/magic-items';
  import { provideSectionOpener } from '~section/composables';
  import { SectionLink } from '~section/list';

  import { formatLootPrice, getLootCountLabel } from '../model';

  /**
   * Магический предмет добычи плиткой раздела: редкость, цена и
   * количество одинаковых. Клик открывает его в дровере инструмента,
   * Ctrl-клик — страницу предмета.
   */
  const { group, isActive = false } = defineProps<{
    group: LootGroup<LootMagicItem>;
    /** Предмет открыт в дровере. */
    isActive?: boolean;
  }>();

  const emit = defineEmits<{
    select: [];
  }>();

  const countLabel = computed(() => getLootCountLabel(group.count));

  const priceLabel = computed(() => {
    if (group.price === undefined) {
      return undefined;
    }

    return formatLootPrice(group.price);
  });

  // У свитков один адрес на всех, поэтому открывает плитка, а не адрес
  provideSectionOpener({
    activePath: computed(() => {
      if (!isActive) {
        return undefined;
      }

      return group.item.url;
    }),
    open: () => emit('select'),
    close: noop,
  });
</script>

<template>
  <SectionLink
    :to="group.item.url"
    :title="group.item.name.rus"
    :subtitle="group.item.name.eng"
    :source="group.item.source"
  >
    <template #details>
      <MagicItemRarity
        :rarity="group.item.rarity"
        class="shrink-0"
      />

      <span
        v-if="priceLabel"
        class="ml-auto shrink-0 text-highlighted"
      >
        {{ priceLabel }}
      </span>
    </template>

    <template
      v-if="countLabel"
      #trailing
    >
      <UBadge
        :label="countLabel"
        color="neutral"
        variant="subtle"
        class="shrink-0"
      />
    </template>
  </SectionLink>
</template>
