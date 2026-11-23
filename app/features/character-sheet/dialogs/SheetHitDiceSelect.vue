<script setup lang="ts">
  import type { HitDiceTotal } from '../model';

  import { clamp } from 'es-toolkit';

  import { HIT_DIE_LABEL_PREFIX, REST_TEXT, SHEET_ICON } from '../model';

  /**
   * Выбор костей хитов к броску на коротком отдыхе: по строке на размер
   * кости, выбрать можно не больше оставшихся.
   */
  const { totals } = defineProps<{
    totals: ReadonlyArray<HitDiceTotal>;
  }>();

  /** Выбранное число костей по размеру. */
  const counts = defineModel<Record<number, number>>({ required: true });

  const rows = computed(() =>
    totals.map((total) => {
      const remaining = total.total - total.used;
      const label = `${HIT_DIE_LABEL_PREFIX}${total.die}`;
      const selected = Math.min(counts.value[total.die] ?? 0, remaining);

      return {
        die: total.die,
        label,
        remaining,
        total: total.total,
        selected,
        selectedClass: selected > 0 ? 'text-primary' : 'text-dimmed',
        addLabel: `${REST_TEXT.diceAdd} ${label}`,
        removeLabel: `${REST_TEXT.diceRemove} ${label}`,
        isMinusDisabled: selected <= 0,
        isPlusDisabled: selected >= remaining,
      };
    }),
  );

  /**
   * Меняет выбор костей размера в пределах остатка.
   * @param row - строка размера кости
   * @param delta - сдвиг
   */
  function adjust(
    row: { die: number; selected: number; remaining: number },
    delta: number,
  ): void {
    counts.value = {
      ...counts.value,
      [row.die]: clamp(row.selected + delta, 0, row.remaining),
    };
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-for="row in rows"
      :key="row.die"
      class="flex items-center gap-2 rounded bg-elevated/30 px-2 py-1.5"
    >
      <span class="w-10 shrink-0 text-sm font-bold text-highlighted">
        {{ row.label }}
      </span>

      <span class="text-xs text-muted">
        <span class="font-bold text-highlighted">{{ row.remaining }}</span>
        / {{ row.total }}
      </span>

      <div class="ml-auto flex items-center gap-1">
        <UButton
          :icon="SHEET_ICON.minus"
          :aria-label="row.removeLabel"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="row.isMinusDisabled"
          @click.left.exact.prevent="adjust(row, -1)"
        />

        <span
          class="w-6 text-center text-sm font-bold tabular-nums"
          :class="row.selectedClass"
        >
          {{ row.selected }}
        </span>

        <UButton
          :icon="SHEET_ICON.plus"
          :aria-label="row.addLabel"
          color="neutral"
          variant="ghost"
          size="xs"
          square
          :disabled="row.isPlusDisabled"
          @click.left.exact.prevent="adjust(row, 1)"
        />
      </div>
    </div>
  </div>
</template>
