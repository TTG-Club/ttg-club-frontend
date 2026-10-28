<script setup lang="ts">
  import type { RollEntry } from '../model';

  import { ROLL_DICE_LABEL, ROLL_HISTORY_TIME_FORMAT } from '../model';

  /** Бросок в истории: результат, источник, формула и время. */
  const { entry } = defineProps<{
    entry: RollEntry;
  }>();

  const time = useDateFormat(() => entry.date, ROLL_HISTORY_TIME_FORMAT);

  const resultClass = computed(() => {
    if (entry.critical === 'success') {
      return 'text-advantage';
    }

    if (entry.critical === 'failure') {
      return 'text-disadvantage';
    }

    return 'text-highlighted';
  });

  const description = computed(() =>
    [
      entry.label,
      entry.formula,
      entry.dice.length ? `${ROLL_DICE_LABEL}: ${entry.dice.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  );
</script>

<template>
  <div class="flex gap-2 px-2 py-3 not-first:border-t not-first:border-default">
    <div
      :class="resultClass"
      class="w-[3ch] flex-none text-center text-2xl leading-none font-semibold"
    >
      {{ entry.value }}
    </div>

    <div class="min-w-0 flex-auto">
      <div v-if="entry.source">
        {{ entry.source }}
      </div>

      <div class="flex gap-1 text-sm text-muted">
        <div class="flex-auto break-all">
          {{ description }}
        </div>

        <div class="flex-none self-end">
          {{ time }}
        </div>
      </div>
    </div>
  </div>
</template>
