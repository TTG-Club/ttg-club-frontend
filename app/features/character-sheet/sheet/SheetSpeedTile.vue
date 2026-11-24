<script setup lang="ts">
  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    EXTRA_SPEED_KEYS,
    formatDistance,
    formatDistanceValue,
    SHEET_BODY_LABELS,
    SPEED_LABELS,
    SPEED_SETTINGS_TEXT,
    SPEED_UNIT_SHORT_LABELS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Плитка скорости ходьбы. Подсказка показывает особые скорости и чувства,
   * клик открывает их настройку.
   */
  const emit = defineEmits<{
    edit: [];
  }>();

  const { document } = useCharacterSheet();
  const { stats } = useSheetStats();

  const unit = computed(() => document.value.speedUnit);

  const walkValue = computed(() =>
    formatDistanceValue(stats.value.speeds.walk, unit.value),
  );

  const unitLabel = computed(() => SPEED_UNIT_SHORT_LABELS[unit.value]);

  /**
   * Подпись вида передвижения; у полёта — с парением.
   * @param key - вид передвижения
   */
  function getSpeedLabel(key: (typeof EXTRA_SPEED_KEYS)[number]): string {
    return key === 'fly' && document.value.speedHover
      ? `${SPEED_LABELS.fly} (${SPEED_SETTINGS_TEXT.hoverShort})`
      : SPEED_LABELS[key];
  }

  const rows = computed(() => [
    ...EXTRA_SPEED_KEYS.flatMap((key) =>
      stats.value.speeds[key]
        ? [
            {
              key,
              value: formatDistance(stats.value.speeds[key], unit.value),
              label: getSpeedLabel(key),
            },
          ]
        : [],
    ),
    ...stats.value.senses.map((sense) => ({
      key: sense.key,
      value: formatDistance(sense.range, unit.value),
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
          {{ walkValue }}

          <span class="text-xs font-normal text-dimmed">
            {{ unitLabel }}
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
