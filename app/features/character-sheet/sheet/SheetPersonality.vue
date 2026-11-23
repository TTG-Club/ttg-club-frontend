<script setup lang="ts">
  import type { SheetPersonality } from '../model';

  import { useCharacterSheet } from '../composables';
  import { SHEET_LABELS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Личность персонажа: черты, идеалы, привязанности, слабости, внешность и история. */
  const { document, update } = useCharacterSheet();

  const fields: ReadonlyArray<{
    key: keyof SheetPersonality;
    label: string;
    rows: number;
  }> = [
    { key: 'traits', label: SHEET_LABELS.personalityTraits, rows: 2 },
    { key: 'ideals', label: SHEET_LABELS.ideals, rows: 2 },
    { key: 'bonds', label: SHEET_LABELS.bonds, rows: 2 },
    { key: 'flaws', label: SHEET_LABELS.flaws, rows: 2 },
    { key: 'appearance', label: SHEET_LABELS.appearance, rows: 3 },
    { key: 'backstory', label: SHEET_LABELS.backstory, rows: 6 },
  ];

  /**
   * Меняет поле личности.
   * @param key - поле
   * @param value - новый текст
   */
  function setField(key: keyof SheetPersonality, value: string): void {
    update((current) => ({
      ...current,
      personality: { ...current.personality, [key]: value },
    }));
  }
</script>

<template>
  <SheetPanel>
    <div class="grid gap-3 md:grid-cols-2">
      <UFormField
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
      >
        <UTextarea
          :model-value="document.personality[field.key]"
          :rows="field.rows"
          autoresize
          class="w-full"
          @update:model-value="setField(field.key, $event)"
        />
      </UFormField>
    </div>
  </SheetPanel>
</template>
