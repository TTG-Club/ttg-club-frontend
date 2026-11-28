<script setup lang="ts">
  import type { EncounterThresholds } from '../model';

  import {
    DIFFICULTY_LABEL,
    formatExperience,
    getBudgetSegments,
    getBudgetSpentLabel,
    SEGMENT_CLASSES,
  } from '../model';

  /**
   * Шкала сложности: четыре отрезка между порогами группы. Подпись под
   * отрезком — порог на его правом краю: дошёл опыт до него — достигнута
   * подписанная сложность.
   */
  const { adjustedExperience, thresholds } = defineProps<{
    adjustedExperience: number;
    thresholds: EncounterThresholds;
  }>();

  const segments = computed(() =>
    getBudgetSegments(adjustedExperience, thresholds).map((segment) => ({
      ...segment,
      label: DIFFICULTY_LABEL[segment.threshold],
      thresholdText: formatExperience(thresholds[segment.threshold]),
      trackClass: SEGMENT_CLASSES[segment.difficulty].track,
      fillClass: SEGMENT_CLASSES[segment.difficulty].fill,
      widthStyle: { width: `${segment.width * 100}%` },
      fillStyle: { width: `${segment.fill * 100}%` },
    })),
  );

  const isDeadly = computed(
    () => thresholds.deadly > 0 && adjustedExperience >= thresholds.deadly,
  );

  const spentLabel = computed(() =>
    getBudgetSpentLabel(adjustedExperience, thresholds),
  );
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex h-4 w-full items-center gap-0.5 overflow-hidden rounded-full"
      role="progressbar"
      :aria-valuenow="adjustedExperience"
      :aria-valuemin="0"
      :aria-valuemax="thresholds.deadly"
      :aria-valuetext="spentLabel"
    >
      <div
        v-for="segment in segments"
        :key="segment.difficulty"
        class="h-full overflow-hidden"
        :class="segment.trackClass"
        :style="segment.widthStyle"
      >
        <div
          class="h-full transition-[width] duration-300"
          :class="segment.fillClass"
          :style="segment.fillStyle"
        />
      </div>

      <UIcon
        v-if="isDeadly"
        name="tabler:skull"
        class="size-4 shrink-0 text-error"
      />
    </div>

    <div class="flex w-full gap-0.5 text-xs">
      <div
        v-for="segment in segments"
        :key="segment.difficulty"
        class="flex min-w-0 flex-col items-end text-right"
        :style="segment.widthStyle"
      >
        <span class="truncate text-muted">{{ segment.label }}</span>

        <span class="font-medium text-highlighted tabular-nums">
          {{ segment.thresholdText }}
        </span>
      </div>
    </div>
  </div>
</template>
