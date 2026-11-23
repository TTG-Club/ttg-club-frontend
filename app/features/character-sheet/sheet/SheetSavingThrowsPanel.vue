<script setup lang="ts">
  import type { AbilityKey } from '../model';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    ABILITY_EFFECT_KEYS,
    ABILITY_KEYS,
    ABILITY_LABELS,
    EFFECTS_TEXT,
    formatModifier,
    PROFICIENCY_DOT_ICONS,
    SHEET_BODY_LABELS,
    SHEET_LABELS,
  } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /**
   * Спасброски сеткой в две колонки: точка владения (клик — переключить) и
   * бонус с эффектами (клик — бросок с преимуществом или помехой от
   * эффектов). Автопровал от состояния подписан.
   */
  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollD20 } = useSheetRoll();

  const rows = computed(() =>
    ABILITY_KEYS.map((key) => {
      const isProficient = document.value.savingThrows.includes(key);
      const save = stats.value.savingThrows[key];

      return {
        key,
        label: ABILITY_LABELS[key].name,
        bonus: save.bonus,
        value: save.isAutoFail
          ? EFFECTS_TEXT.autoFail
          : formatModifier(save.bonus),
        icon: isProficient
          ? PROFICIENCY_DOT_ICONS.proficient
          : PROFICIENCY_DOT_ICONS.none,
        iconClass: isProficient ? 'text-primary' : 'text-dimmed',
        valueClass: save.isAutoFail ? 'text-error' : 'text-highlighted',
      };
    }),
  );

  /**
   * Переключает владение спасброском.
   * @param key - характеристика
   */
  function toggle(key: AbilityKey): void {
    update((current) => ({
      ...current,
      savingThrows: current.savingThrows.includes(key)
        ? current.savingThrows.filter((ability) => ability !== key)
        : [...current.savingThrows, key],
    }));
  }

  /**
   * Спасбросок.
   * @param key - характеристика
   * @param bonus - бонус спасброска
   * @param event - клик
   */
  function roll(key: AbilityKey, bonus: number, event: MouseEvent): void {
    rollD20(
      `${SHEET_LABELS.savingThrow}: ${ABILITY_LABELS[key].name}`,
      bonus,
      event,
      { kind: 'savingThrow', ability: ABILITY_EFFECT_KEYS[key] },
    );
  }
</script>

<template>
  <SheetPanel :title="SHEET_BODY_LABELS.savingThrows">
    <div class="grid grid-flow-col grid-cols-2 grid-rows-3 gap-2">
      <div
        v-for="row in rows"
        :key="row.key"
        class="relative flex items-center gap-2 rounded border border-transparent bg-default/30 px-2 py-1.5 transition-colors hover:border-primary/60 hover:bg-accented/40"
      >
        <button
          type="button"
          class="z-10 flex cursor-pointer items-center"
          :aria-label="`${SHEET_BODY_LABELS.proficiency}: ${row.label}`"
          @click.left.exact.prevent="toggle(row.key)"
        >
          <UIcon
            :name="row.icon"
            class="size-3 shrink-0 transition-colors hover:text-primary"
            :class="row.iconClass"
          />
        </button>

        <button
          type="button"
          class="flex min-w-0 grow cursor-pointer items-center after:absolute after:inset-0 after:cursor-pointer"
          :aria-label="`${SHEET_BODY_LABELS.roll}: ${row.label}`"
          @click.left.prevent="roll(row.key, row.bonus, $event)"
        >
          <span class="truncate text-xs text-toned">{{ row.label }}</span>

          <span
            class="ml-auto rounded border border-default/50 bg-default/60 px-1.5 text-sm font-bold"
            :class="row.valueClass"
          >
            {{ row.value }}
          </span>
        </button>
      </div>
    </div>
  </SheetPanel>
</template>
