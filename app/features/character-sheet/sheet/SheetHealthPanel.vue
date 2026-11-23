<script setup lang="ts">
  import { useCharacterSheet, useSheetStats } from '../composables';
  import { getHitDiceTotals, SHEET_BODY_LABELS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Панель здоровья: текущие хиты, максимум с механикой и эффектами,
   * временные хиты и кости хитов. Клик открывает правку хитов.
   */
  const emit = defineEmits<{
    edit: [];
  }>();

  const { document } = useCharacterSheet();
  const { stats } = useSheetStats();

  const hitDice = computed(() =>
    getHitDiceTotals(document.value).reduce(
      (sum, total) => ({
        current: sum.current + total.total - total.used,
        max: sum.max + total.total,
      }),
      { current: 0, max: 0 },
    ),
  );

  /** Максимум с прибавками не сходится с записанным — он выделен цветом. */
  const maxClass = computed(() =>
    stats.value.hitPointsMax === document.value.health.max
      ? 'text-muted'
      : 'text-primary',
  );

  const maxHint = computed(() =>
    stats.value.hitPointsMax === document.value.health.max
      ? ''
      : `${document.value.health.max} → ${stats.value.hitPointsMax}`,
  );
</script>

<template>
  <SheetPanel
    :title="SHEET_BODY_LABELS.health"
    interactive
  >
    <button
      type="button"
      class="w-full cursor-pointer pt-1 text-left after:absolute after:inset-0 after:cursor-pointer"
      :aria-label="SHEET_BODY_LABELS.health"
      @click.left.exact.prevent="emit('edit')"
    >
      <span class="grid grid-cols-3 items-end gap-2 text-center">
        <span class="flex flex-col items-start">
          <span class="text-[10px] text-muted uppercase">
            {{ SHEET_BODY_LABELS.current }}
          </span>

          <span class="mt-1 text-2xl leading-none font-bold text-highlighted">
            {{ document.health.current }}
          </span>
        </span>

        <span class="flex flex-col items-center">
          <span class="text-[10px] text-muted uppercase">
            {{ SHEET_BODY_LABELS.total }}
          </span>

          <UTooltip
            :text="maxHint"
            :disabled="!maxHint"
          >
            <span
              class="mt-1 text-lg leading-none font-medium"
              :class="maxClass"
            >
              / {{ stats.hitPointsMax }}
            </span>
          </UTooltip>
        </span>

        <span class="flex flex-col items-end">
          <span class="text-[10px] text-muted uppercase">
            {{ SHEET_BODY_LABELS.temporary }}
          </span>

          <span class="mt-1 text-xl leading-none font-bold text-primary">
            {{ document.health.temporary }}
          </span>
        </span>
      </span>

      <span
        class="mt-3 flex items-center justify-between border-t border-default/50 pt-3"
      >
        <span class="text-[10px] font-bold text-muted uppercase">
          {{ SHEET_BODY_LABELS.hitDice }}
        </span>

        <span class="text-sm font-bold text-highlighted">
          {{ hitDice.current }} / {{ hitDice.max }}
        </span>
      </span>
    </button>
  </SheetPanel>
</template>
