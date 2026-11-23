<script setup lang="ts">
  import type { CustomBonus, SpeedKey, SpeedUnit } from '../model';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    createCustomBonus,
    createSheetElementId,
    formatDistance,
    fromSpeedUnit,
    getSheetStats,
    SPEED_BONUS_KINDS,
    SPEED_BONUS_RANGE,
    SPEED_INPUT_STEP,
    SPEED_KEYS,
    SPEED_LABELS,
    SPEED_RANGE,
    SPEED_SETTINGS_TEXT,
    SPEED_UNIT_OPTIONS,
    SPEED_UNITS,
    toSpeedUnit,
  } from '../model';
  import SheetCustomBonusRows from './SheetCustomBonusRows.vue';

  /**
   * Передвижение, как на new.ttg.club: своё значение каждого вида, бонусы
   * к нему, парение и единицы листа. Лист хранит футы, окно показывает и
   * принимает значения в выбранных единицах. Правки копятся в черновике и
   * уходят в лист по «Применить»; итоги считаются той же функцией, что и лист.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const unit = ref<SpeedUnit>('feet');
  const isHover = ref(false);
  const values = ref<Record<SpeedKey, number>>(createEmptyValues());

  const bonuses =
    ref<Record<SpeedKey, Array<CustomBonus>>>(createEmptyBonuses());

  function createEmptyValues(): Record<SpeedKey, number> {
    return { walk: 0, fly: 0, climb: 0, swim: 0, burrow: 0 };
  }

  function createEmptyBonuses(): Record<SpeedKey, Array<CustomBonus>> {
    return { walk: [], fly: [], climb: [], swim: [], burrow: [] };
  }

  /**
   * Переводит черновик в другие единицы: числа и свои бонусы.
   * @param from - прежние единицы
   * @param to - новые единицы
   */
  function convertDraft(from: SpeedUnit, to: SpeedUnit): void {
    const convert = (value: number): number =>
      toSpeedUnit(fromSpeedUnit(value, from), to);

    for (const key of SPEED_KEYS) {
      values.value[key] = convert(values.value[key]);

      bonuses.value[key] = bonuses.value[key].map((bonus) => ({
        ...bonus,
        value: convert(bonus.value),
      }));
    }
  }

  // Черновик снимается с листа при каждом открытии окна, сразу в единицах
  // листа
  watch(isOpen, (opened) => {
    if (!opened) {
      return;
    }

    const current = document.value;
    const sheetUnit = current.speedUnit;

    unit.value = sheetUnit;
    isHover.value = current.speedHover;

    values.value = {
      walk: toSpeedUnit(current.speed, sheetUnit),
      fly: toSpeedUnit(current.speeds.fly, sheetUnit),
      climb: toSpeedUnit(current.speeds.climb, sheetUnit),
      swim: toSpeedUnit(current.speeds.swim, sheetUnit),
      burrow: toSpeedUnit(current.speeds.burrow, sheetUnit),
    };

    const next = createEmptyBonuses();

    for (const key of SPEED_KEYS) {
      next[key] = (current.speedBonuses[key] ?? []).map((bonus) => ({
        ...bonus,
        value: toSpeedUnit(bonus.value, sheetUnit),
      }));
    }

    bonuses.value = next;
  });

  /**
   * Смена единиц пересчитывает введённое, а не оставляет «30» метрами.
   * @param value - выбранные единицы
   */
  function setUnit(value: unknown): void {
    const next = SPEED_UNITS.find((item) => item === value);

    if (!next || next === unit.value) {
      return;
    }

    convertDraft(unit.value, next);
    unit.value = next;
  }

  /**
   * Черновик в футах: в таком виде он уходит в лист.
   * @param key - вид передвижения
   */
  function toStoredFeet(key: SpeedKey): number {
    return Math.max(
      SPEED_RANGE.min,
      fromSpeedUnit(values.value[key], unit.value),
    );
  }

  const storedBonuses = computed(() => {
    const result: Partial<Record<SpeedKey, Array<CustomBonus>>> = {};

    for (const key of SPEED_KEYS) {
      if (bonuses.value[key].length) {
        result[key] = bonuses.value[key].map((bonus) => ({
          ...bonus,
          value: fromSpeedUnit(bonus.value, unit.value),
        }));
      }
    }

    return result;
  });

  const draftDocument = computed(() => ({
    ...document.value,
    speed: toStoredFeet('walk'),
    speeds: {
      fly: toStoredFeet('fly'),
      climb: toStoredFeet('climb'),
      swim: toStoredFeet('swim'),
      burrow: toStoredFeet('burrow'),
    },
    speedBonuses: storedBonuses.value,
    speedHover: isHover.value,
    speedUnit: unit.value,
  }));

  const draftSpeeds = computed(() => getSheetStats(draftDocument.value).speeds);

  const inputRange = computed(() => ({
    min: SPEED_RANGE.min,
    max: toSpeedUnit(SPEED_RANGE.max, unit.value),
  }));

  const bonusRange = computed(() => ({
    min: toSpeedUnit(SPEED_BONUS_RANGE.min, unit.value),
    max: toSpeedUnit(SPEED_BONUS_RANGE.max, unit.value),
  }));

  const unitItems = [...SPEED_UNIT_OPTIONS];

  const step = computed(() => SPEED_INPUT_STEP[unit.value]);

  const rows = computed(() =>
    SPEED_KEYS.map((key) => {
      const total = draftSpeeds.value[key];

      const isChanged =
        bonuses.value[key].length > 0
        || total !== fromSpeedUnit(values.value[key], unit.value);

      return {
        key,
        label: SPEED_LABELS[key],
        isFly: key === 'fly',
        formattedTotal: formatDistance(total, unit.value),
        frameClass: isChanged ? 'border-primary/40' : 'border-default/50',
      };
    }),
  );

  /**
   * Добавляет виду передвижения бонус: он правится тут же в строке.
   * @param key - вид передвижения
   */
  function addBonus(key: SpeedKey): void {
    bonuses.value[key] = [
      ...bonuses.value[key],
      { ...createCustomBonus(createSheetElementId()), value: step.value },
    ];
  }

  function apply(): void {
    const next = draftDocument.value;

    update((current) => ({
      ...current,
      speed: next.speed,
      speeds: next.speeds,
      speedBonuses: next.speedBonuses,
      speedHover: next.speedHover,
      speedUnit: next.speedUnit,
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
    :title="SPEED_SETTINGS_TEXT.title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-2">
        <p class="text-xs text-dimmed">
          {{ SPEED_SETTINGS_TEXT.hint }}
        </p>

        <div
          v-for="row in rows"
          :key="row.key"
          class="flex flex-col gap-2 rounded-lg border bg-elevated/20 p-2 transition-colors"
          :class="row.frameClass"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="min-w-0 grow truncate text-sm text-toned">
              {{ row.label }}
            </span>

            <UCheckbox
              v-if="row.isFly"
              v-model="isHover"
              :label="SPEED_SETTINGS_TEXT.hover"
              class="shrink-0"
            />

            <UTooltip :text="SPEED_SETTINGS_TEXT.total">
              <span
                class="w-16 shrink-0 text-right text-sm font-bold text-highlighted tabular-nums"
              >
                {{ row.formattedTotal }}
              </span>
            </UTooltip>

            <UInputNumber
              v-model="values[row.key]"
              :min="inputRange.min"
              :max="inputRange.max"
              :step="step"
              class="w-32 shrink-0"
              :aria-label="`${SPEED_SETTINGS_TEXT.ownValue}: ${row.label}`"
            />

            <UTooltip :text="SPEED_SETTINGS_TEXT.addBonus">
              <UButton
                icon="tabler:plus"
                color="neutral"
                variant="subtle"
                size="xs"
                square
                class="shrink-0"
                :aria-label="`${SPEED_SETTINGS_TEXT.addBonus}: ${row.label}`"
                @click.left.exact.prevent="addBonus(row.key)"
              />
            </UTooltip>
          </div>

          <SheetCustomBonusRows
            v-if="bonuses[row.key].length"
            v-model="bonuses[row.key]"
            :classes="document.classes"
            :context="stats.bonusContext"
            :kinds="SPEED_BONUS_KINDS"
            :with-add="false"
            :range="bonusRange"
            :step="step"
            class="border-l-2 border-primary/40 pl-2"
          />
        </div>

        <USeparator class="my-1" />

        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-toned">
            {{ SPEED_SETTINGS_TEXT.unitTitle }}
          </span>

          <USelect
            :model-value="unit"
            :items="unitItems"
            class="w-40"
            @update:model-value="setUnit"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="SPEED_SETTINGS_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="SPEED_SETTINGS_TEXT.apply"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
