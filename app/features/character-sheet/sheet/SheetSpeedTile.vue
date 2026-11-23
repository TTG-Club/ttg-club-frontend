<script setup lang="ts">
  import { useSheetStats } from '../composables';
  import {
    EXTRA_SPEED_KEYS,
    SHEET_BODY_LABELS,
    SHEET_LABELS,
    SPEED_LABELS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Плитка скорости ходьбы. Подсказка показывает особые скорости и чувства,
   * клик открывает их настройку.
   */
  const emit = defineEmits<{
    edit: [];
  }>();

  const { stats } = useSheetStats();

  const rows = computed(() => [
    ...EXTRA_SPEED_KEYS.flatMap((key) =>
      stats.value.speeds[key]
        ? [
            {
              key,
              value: `${stats.value.speeds[key]} ${SHEET_LABELS.speedUnit}`,
              label: SPEED_LABELS[key],
            },
          ]
        : [],
    ),
    ...stats.value.senses.map((sense) => ({
      key: sense.key,
      value: `${sense.range} ${SHEET_LABELS.speedUnit}`,
      label: sense.label,
    })),
  ]);
</script>

<template>
  <UTooltip :disabled="!rows.length">
    <SheetPanel
      :title="SHEET_BODY_LABELS.walk"
      center-title
      interactive
      class="w-full"
    >
      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center pt-1 after:absolute after:inset-0 after:cursor-pointer"
        :aria-label="SHEET_BODY_LABELS.walk"
        @click.left.exact.prevent="emit('edit')"
      >
        <span class="text-2xl leading-none font-bold text-highlighted">
          {{ stats.speeds.walk }}

          <span class="text-xs font-normal text-dimmed">
            {{ SHEET_LABELS.speedUnit }}
          </span>
        </span>
      </button>
    </SheetPanel>

    <template #content>
      <div class="flex flex-col gap-1 p-1">
        <div
          v-for="row in rows"
          :key="row.key"
          class="flex items-baseline gap-2 text-xs"
        >
          <span class="w-14 shrink-0 font-bold text-highlighted">
            {{ row.value }}
          </span>

          <span class="text-muted">{{ row.label }}</span>
        </div>
      </div>
    </template>
  </UTooltip>
</template>
