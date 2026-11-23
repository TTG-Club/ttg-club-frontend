<script setup lang="ts">
  import type { SheetCarrying, SheetSize } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    CARRYING_CAPACITY_MULTIPLIER,
    CARRYING_TEXT,
    getCarryingBreakdown,
    getCarryingSize,
    getCoinWeight,
    getEncumbrance,
    getItemsWeight,
    SHEET_SIZE_INFO,
    SHEET_SIZE_KEYS,
  } from '../model';

  /**
   * Грузоподъёмность, как на new.ttg.club: переносимый вес (предметы и
   * монеты), Сила × 15 × множитель размера, свой размер для расчёта, своё
   * значение или бонус. Для 2014 — вариант «Нагрузка» со ступенями и
   * снижение скорости в доспехе, которому не хватает Силы.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  /** Пункт «как у персонажа» в выборе размера. */
  const SIZE_AUTO = 'AUTO';

  const draft = ref<SheetCarrying>({ ...document.value.carrying });

  watch(isOpen, (open) => {
    if (open) {
      draft.value = { ...document.value.carrying };
    }
  });

  const sizeItems = [
    { label: CARRYING_TEXT.sizeAuto, value: SIZE_AUTO },
    ...SHEET_SIZE_KEYS.map((key) => ({
      label: SHEET_SIZE_INFO[key].name,
      value: key,
    })),
  ];

  const sizeValue = computed(() => draft.value.size ?? SIZE_AUTO);

  const draftDocument = computed(() => ({
    carrying: draft.value,
    size: document.value.size,
  }));

  const breakdown = computed(() =>
    getCarryingBreakdown(draftDocument.value, stats.value.abilities.STRENGTH),
  );

  const itemsWeight = computed(() => getItemsWeight(document.value.inventory));
  const coinsWeight = computed(() => getCoinWeight(document.value.currency));
  const weight = computed(() => stats.value.carriedWeight);

  const formula = computed(() => {
    const size = SHEET_SIZE_INFO[getCarryingSize(draftDocument.value)].name;

    return `${breakdown.value.strength} × ${CARRYING_CAPACITY_MULTIPLIER} × ${breakdown.value.multiplier} (${size.toLowerCase()}) = ${breakdown.value.base}`;
  });

  const encumbrance = computed(() =>
    getEncumbrance(draftDocument.value, breakdown.value, weight.value),
  );

  const notices = computed(() => [
    ...(weight.value > breakdown.value.value
      ? [
          {
            key: 'over',
            text: CARRYING_TEXT.overloaded,
            color: 'error' as const,
          },
        ]
      : []),
    ...(encumbrance.value === 'encumbered'
      ? [
          {
            key: 'encumbered',
            text: CARRYING_TEXT.encumbered,
            color: 'warning' as const,
          },
        ]
      : []),
    ...(encumbrance.value === 'heavy'
      ? [
          {
            key: 'heavy',
            text: CARRYING_TEXT.heavilyEncumbered,
            color: 'error' as const,
          },
        ]
      : []),
    ...(stats.value.isArmorTooHeavy
      ? [
          {
            key: 'armor',
            text: CARRYING_TEXT.armorStrength,
            color: 'warning' as const,
          },
        ]
      : []),
  ]);

  const thresholds = computed(
    () =>
      `${breakdown.value.encumberedAt} / ${breakdown.value.heavyAt} ${CARRYING_TEXT.unit}`,
  );

  /**
   * Размер для расчёта.
   * @param value - выбранный пункт
   */
  function setSize(value: unknown): void {
    const size: SheetSize | undefined = SHEET_SIZE_KEYS.find(
      (key) => key === value,
    );

    draft.value = { ...draft.value, size: size ?? null };
  }

  /**
   * Своё значение; пустое поле возвращает расчёт.
   * @param value - фунты
   */
  function setCustom(value: number | null): void {
    draft.value = {
      ...draft.value,
      custom: value === null ? null : Math.max(0, Math.trunc(value)),
    };
  }

  /**
   * Бонус к грузоподъёмности.
   * @param value - фунты
   */
  function setBonus(value: number | null): void {
    draft.value = { ...draft.value, bonus: Math.trunc(value ?? 0) };
  }

  /**
   * Вариант «Нагрузка».
   * @param value - включён ли
   */
  function setEncumbrance(value: boolean): void {
    draft.value = { ...draft.value, encumbrance: value };
  }

  function apply(): void {
    const carrying = { ...draft.value };

    update((current) => ({ ...current, carrying }));
    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="CARRYING_TEXT.title"
    :description="CARRYING_TEXT.description"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-2">
          <div
            class="flex flex-col gap-1 rounded-lg border border-default/50 bg-elevated/20 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ CARRYING_TEXT.weight }}
            </span>

            <span class="text-2xl leading-none font-bold text-highlighted">
              {{ weight }}
            </span>

            <span class="text-[10px] text-dimmed">
              {{ CARRYING_TEXT.items }} {{ itemsWeight }} ·
              {{ CARRYING_TEXT.coins }} {{ coinsWeight }}
            </span>
          </div>

          <div
            class="flex flex-col gap-1 rounded-lg border border-primary/40 bg-primary/10 p-3"
          >
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ CARRYING_TEXT.capacity }}
            </span>

            <span class="text-2xl leading-none font-bold text-primary">
              {{ breakdown.value }}
            </span>

            <span class="text-[10px] text-dimmed">{{ formula }}</span>
          </div>
        </div>

        <div
          v-if="notices.length"
          class="flex flex-col gap-2"
        >
          <UAlert
            v-for="notice in notices"
            :key="notice.key"
            :color="notice.color"
            variant="subtle"
            icon="tabler:alert-triangle"
            :description="notice.text"
          />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <UFormField :label="CARRYING_TEXT.size">
            <USelect
              :model-value="sizeValue"
              :items="sizeItems"
              class="w-full"
              @update:model-value="setSize"
            />
          </UFormField>

          <UFormField :label="CARRYING_TEXT.bonus">
            <UInputNumber
              :model-value="draft.bonus"
              :disabled="draft.custom !== null"
              class="w-full"
              @update:model-value="setBonus"
            />
          </UFormField>

          <UFormField
            :label="CARRYING_TEXT.custom"
            :help="CARRYING_TEXT.customHint"
          >
            <UInputNumber
              :model-value="draft.custom ?? undefined"
              :min="0"
              class="w-full"
              @update:model-value="setCustom"
            />
          </UFormField>
        </div>

        <USeparator />

        <div class="flex flex-col gap-2">
          <USwitch
            :model-value="draft.encumbrance"
            :label="CARRYING_TEXT.encumbrance"
            @update:model-value="setEncumbrance"
          />

          <p class="text-xs text-dimmed">
            {{ CARRYING_TEXT.encumbranceHint }}
          </p>

          <p
            v-if="draft.encumbrance"
            class="text-xs text-toned"
          >
            {{ thresholds }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="CARRYING_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="CARRYING_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
