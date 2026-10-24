<script setup lang="ts">
  import type { EntrySource } from '../model';

  import { SOURCE_TAG_COLORS } from '../model';

  /**
   * Источник записи в шапке, как на new.ttg.club: маленькая метка книги
   * цветом её группы и рядом метка самой группы. Полные названия —
   * в подсказках.
   */
  const { source } = defineProps<{
    source: EntrySource;
  }>();

  const color = computed(
    () =>
      SOURCE_TAG_COLORS[source.group?.shortName.toLowerCase() ?? '']
      ?? 'neutral',
  );
</script>

<template>
  <div class="flex shrink-0 gap-1">
    <UTooltip :text="source.name">
      <UBadge
        :color="color"
        variant="subtle"
        size="sm"
      >
        {{ source.shortName }}
      </UBadge>
    </UTooltip>

    <UTooltip
      v-if="source.group"
      :text="source.group.name"
    >
      <UBadge
        variant="subtle"
        size="sm"
      >
        {{ source.group.shortName }}
      </UBadge>
    </UTooltip>
  </div>
</template>
