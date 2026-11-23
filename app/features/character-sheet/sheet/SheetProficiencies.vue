<script setup lang="ts">
  import type { SheetProficiencies } from '../model';

  import { useCharacterSheet } from '../composables';
  import { SHEET_LABELS } from '../model';
  import SheetPanel from './SheetPanel.vue';

  /** Владения доспехами, оружием, инструментами и языки — свободным текстом. */
  const { document, update } = useCharacterSheet();

  const fields: ReadonlyArray<{
    key: keyof SheetProficiencies;
    label: string;
  }> = [
    { key: 'armor', label: SHEET_LABELS.armorProficiency },
    { key: 'weapons', label: SHEET_LABELS.weaponProficiency },
    { key: 'tools', label: SHEET_LABELS.toolProficiency },
    { key: 'languages', label: SHEET_LABELS.languages },
  ];

  /**
   * Меняет текст владений.
   * @param key - вид владений
   * @param value - новый текст
   */
  function setField(key: keyof SheetProficiencies, value: string): void {
    update((current) => ({
      ...current,
      proficiencies: { ...current.proficiencies, [key]: value },
    }));
  }
</script>

<template>
  <SheetPanel :title="SHEET_LABELS.proficiencies">
    <UFormField
      v-for="field in fields"
      :key="field.key"
      :label="field.label"
    >
      <UTextarea
        :model-value="document.proficiencies[field.key]"
        :rows="1"
        autoresize
        class="w-full"
        @update:model-value="setField(field.key, $event)"
      />
    </UFormField>
  </SheetPanel>
</template>
