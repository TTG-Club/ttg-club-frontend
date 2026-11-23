<script setup lang="ts">
  import type { DeathSaves } from '../model';

  import { range } from 'es-toolkit';

  import { useCharacterSheet } from '../composables';
  import { DEATH_SAVES_MAX, SHEET_LABELS } from '../model';

  /**
   * Спасброски от смерти при 0 хитов: клик по клетке отмечает успех или
   * провал, клик по последней отмеченной снимает отметку.
   */
  const { document, update } = useCharacterSheet();

  const slots = range(DEATH_SAVES_MAX);

  const groups = computed(() =>
    (['successes', 'failures'] as const).map((field) => ({
      field,
      label: SHEET_LABELS[field],
      cells: slots.map((index) => ({
        index,
        className: getCellClass(field, index),
      })),
    })),
  );

  /**
   * Класс клетки.
   * @param field - успехи или провалы
   * @param index - номер клетки
   */
  function getCellClass(field: keyof DeathSaves, index: number): string {
    if (document.value.deathSaves[field] <= index) {
      return 'border-default';
    }

    return field === 'successes'
      ? 'border-success bg-success'
      : 'border-error bg-error';
  }

  /**
   * Отмечает спасбросок.
   * @param field - успехи или провалы
   * @param index - номер клетки
   */
  function setDeathSave(field: keyof DeathSaves, index: number): void {
    update((current) => {
      const value = current.deathSaves[field] === index + 1 ? index : index + 1;

      return {
        ...current,
        deathSaves: { ...current.deathSaves, [field]: value },
      };
    });
  }
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-[10px] font-bold tracking-wider text-muted uppercase">
      {{ SHEET_LABELS.deathSaves }}
    </span>

    <div class="flex flex-wrap items-center gap-4 text-sm">
      <div
        v-for="group in groups"
        :key="group.field"
        class="flex items-center gap-1"
      >
        <span class="mr-1 text-muted">{{ group.label }}</span>

        <button
          v-for="cell in group.cells"
          :key="cell.index"
          type="button"
          class="size-4 cursor-pointer rounded-full border-2"
          :class="cell.className"
          :aria-label="group.label"
          @click.left.exact.prevent="setDeathSave(group.field, cell.index)"
        />
      </div>
    </div>
  </div>
</template>
