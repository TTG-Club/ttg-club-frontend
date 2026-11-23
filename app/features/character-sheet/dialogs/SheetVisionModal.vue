<script setup lang="ts">
  import type { OwnSenseKey } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    DARKVISION_SENSE,
    OWN_SENSE_KEYS,
    SENSE_LABELS,
    SENSE_RANGE_MAX,
    SENSE_RANGE_STEP,
    SHEET_VISION_LABELS,
  } from '../model';

  /**
   * Чувства персонажа: свои дистанции тёмного, слепого и истинного зрения и
   * чувства вибрации. Под полем — итог листа, если особенности, снаряжение или
   * эффекты дают больше своего значения.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const darkvision = ref(0);
  const ownSenses = ref<Partial<Record<OwnSenseKey, number>>>({});

  // Черновик заново снимается с листа при каждом открытии окна
  watch(isOpen, (opened) => {
    if (opened) {
      darkvision.value = document.value.darkvision;
      ownSenses.value = { ...document.value.ownSenses };
    }
  });

  /**
   * Итог чувства в листе.
   * @param key - ключ чувства
   */
  function getEffectiveRange(key: string): number {
    return stats.value.senses.find((sense) => sense.key === key)?.range ?? 0;
  }

  const rows = computed(() => [
    {
      key: DARKVISION_SENSE,
      label: SENSE_LABELS[DARKVISION_SENSE] ?? DARKVISION_SENSE,
      saved: document.value.darkvision,
      effective: getEffectiveRange(DARKVISION_SENSE),
    },
    ...OWN_SENSE_KEYS.map((key) => ({
      key,
      label: SENSE_LABELS[key] ?? key,
      saved: document.value.ownSenses[key] ?? 0,
      effective: getEffectiveRange(key),
    })),
  ]);

  /**
   * Своё значение чувства в черновике.
   * @param key - ключ чувства
   */
  function getDraft(key: string): number {
    if (key === DARKVISION_SENSE) {
      return darkvision.value;
    }

    const own = OWN_SENSE_KEYS.find((senseKey) => senseKey === key);

    return own ? (ownSenses.value[own] ?? 0) : 0;
  }

  /**
   * Правит своё значение чувства в черновике.
   * @param key - ключ чувства
   * @param value - дистанция
   */
  function setDraft(key: string, value: number | null | undefined): void {
    const range = Math.max(0, value ?? 0);

    if (key === DARKVISION_SENSE) {
      darkvision.value = range;

      return;
    }

    const own = OWN_SENSE_KEYS.find((senseKey) => senseKey === key);

    if (own) {
      ownSenses.value = { ...ownSenses.value, [own]: range };
    }
  }

  function apply(): void {
    const nextDarkvision = darkvision.value;
    const nextSenses = { ...ownSenses.value };

    update((current) => ({
      ...current,
      darkvision: nextDarkvision,
      ownSenses: nextSenses,
    }));

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_VISION_LABELS.title"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <p class="text-xs text-dimmed">{{ SHEET_VISION_LABELS.hint }}</p>

        <div
          v-for="row in rows"
          :key="row.key"
          class="flex flex-col gap-1"
        >
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm text-toned">{{ row.label }}</span>

            <UInputNumber
              :model-value="getDraft(row.key)"
              :min="0"
              :max="SENSE_RANGE_MAX"
              :step="SENSE_RANGE_STEP"
              class="w-40"
              @update:model-value="setDraft(row.key, $event)"
            />
          </div>

          <span
            v-if="row.effective > row.saved"
            class="text-xs text-muted"
          >
            {{ SHEET_VISION_LABELS.effective }}: {{ row.effective }}
            {{ SHEET_VISION_LABELS.unit }}
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SHEET_VISION_LABELS.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SHEET_VISION_LABELS.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
