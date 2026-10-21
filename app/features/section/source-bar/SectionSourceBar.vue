<script setup lang="ts">
  import type { EntrySource } from '../model';

  import { hasSourceGroupLabel, SECTION_TEXT } from '../model';

  /**
   * Плашка под заголовком записи: слева пояснение (категория, тип),
   * справа источник с полным названием книги в подсказке. Замена
   * `DetailTopBar` старого SPA.
   */
  const { left = undefined, source = undefined } = defineProps<{
    left?: string;
    source?: EntrySource | null;
  }>();

  defineSlots<{
    /** Правая часть, когда у записи нет источника. */
    default?: () => unknown;
  }>();

  const group = computed(() =>
    source && hasSourceGroupLabel(source) ? source.group : undefined,
  );
</script>

<template>
  <div
    class="flex flex-col justify-between gap-3 rounded-lg bg-elevated px-3 py-3 xl:flex-row"
  >
    <span
      v-if="left"
      class="flex-auto italic"
    >
      {{ left }}
    </span>

    <span
      v-if="source"
      class="flex shrink-0 gap-1"
    >
      {{ SECTION_TEXT.source }}

      <UTooltip
        v-if="group"
        :text="group.name"
      >
        <span class="text-highlighted">{{ group.shortName }}</span>
      </UTooltip>

      <UTooltip :text="source.name">
        <span class="text-highlighted">{{ source.shortName }}</span>
      </UTooltip>
    </span>

    <span
      v-else
      class="shrink-0"
    >
      <slot />
    </span>
  </div>
</template>
