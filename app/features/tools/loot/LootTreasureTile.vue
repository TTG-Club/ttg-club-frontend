<script setup lang="ts">
  import type { Treasure } from '~inventory/model';

  import type { LootGroup } from '../model';

  import { SectionLink } from '~section/list';

  import { formatLootPrice, getLootCountLabel } from '../model';

  /**
   * Драгоценность, предмет искусства или безделушка плиткой: своих страниц
   * у них нет, поэтому только название, цена и количество.
   */
  const { group } = defineProps<{
    group: LootGroup<Treasure>;
  }>();

  const countLabel = computed(() => getLootCountLabel(group.count));

  // Без цены — ноль, как в старом SPA
  const priceLabel = computed(() => formatLootPrice(group.price ?? 0));
</script>

<template>
  <SectionLink
    :title="group.item.name.rus"
    :source="group.item.source"
  >
    <template #details>
      <span class="ml-auto shrink-0 text-highlighted">
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
