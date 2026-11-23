<script setup lang="ts">
  import type { SheetSize } from '../model';

  import { useCharacterSheet } from '../composables';
  import {
    SHEET_SIZE_INFO,
    SHEET_SIZE_KEYS,
    SHEET_SIZE_LABELS,
  } from '../model';

  /**
   * Размер персонажа: выбор из размеров PHB 2014. При выборе расы размер
   * подставляется из её карточки, здесь его можно поправить или сбросить.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const draft = ref<SheetSize | undefined>();

  const items = SHEET_SIZE_KEYS.map((key) => ({
    value: key,
    label: SHEET_SIZE_INFO[key].name,
  }));

  // Черновик заново снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (opened) {
      draft.value = document.value.size ?? undefined;
    }
  });

  function reset(): void {
    draft.value = undefined;
  }

  function apply(): void {
    const size = draft.value ?? null;

    update((current) => ({ ...current, size }));
    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_SIZE_LABELS.title"
  >
    <template #body>
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-toned">{{ SHEET_SIZE_LABELS.field }}</span>

        <USelect
          v-model="draft"
          :items="items"
          :placeholder="SHEET_SIZE_LABELS.placeholder"
          class="w-48"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          :label="SHEET_SIZE_LABELS.reset"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="reset"
        />

        <div class="flex gap-2">
          <UButton
            :label="SHEET_SIZE_LABELS.cancel"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="cancel"
          />

          <UButton
            :label="SHEET_SIZE_LABELS.apply"
            @click.left.exact.prevent="apply"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
