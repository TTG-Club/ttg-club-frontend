<script setup lang="ts">
  import type { ExtraHitDie, HitDiceTotal, SheetHealth } from '../model';

  import { clamp } from 'es-toolkit';

  import { useCharacterSheet, useSheetStats } from '../composables';
  import {
    createSheetElementId,
    EXTRA_HIT_DICE_COUNT,
    getHitDiceTotals,
    getSuggestedMaxHitPoints,
    HEALTH_TEXT,
    HIT_DIE_LABEL_PREFIX,
    HIT_DIE_SIZES,
    setCurrentHitPoints,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';
  import SheetDeathSaves from './SheetDeathSaves.vue';
  import SheetHitPointsControls from './SheetHitPointsControls.vue';

  /**
   * Настройка здоровья, как на new.ttg.club: текущие, записанный максимум
   * (механика и эффекты прибавляются сверху — итог под полями), временные,
   * быстрые шаги урона и лечения, остаток костей хитов, дополнительные кости
   * не от уровней класса и спасброски от смерти. Правки сразу уходят в лист.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();

  const hitDice = computed(() =>
    getHitDiceTotals(document.value).map((total) => ({
      ...total,
      label: `${HIT_DIE_LABEL_PREFIX}${total.die}`,
      remaining: total.total - total.used,
    })),
  );

  const suggestedMax = computed(() => getSuggestedMaxHitPoints(document.value));

  const isSuggestedVisible = computed(
    () =>
      suggestedMax.value > 0
      && suggestedMax.value !== document.value.health.max,
  );

  const suggestedLabel = computed(
    () => `${HEALTH_TEXT.suggestedMax}: ${suggestedMax.value}`,
  );

  const isMaxChanged = computed(
    () => stats.value.hitPointsMax !== document.value.health.max,
  );

  const maxTotalLabel = computed(
    () => `${HEALTH_TEXT.maxTotal}: ${stats.value.hitPointsMax}`,
  );

  const dieItems = HIT_DIE_SIZES.map(
    (die): { label: string; value: number } => ({
      label: `${HIT_DIE_LABEL_PREFIX}${die}`,
      value: die,
    }),
  );

  const isDying = computed(
    () => stats.value.hitPointsMax > 0 && document.value.health.current === 0,
  );

  /**
   * Текущие хиты: в пределах максимума с прибавками.
   * @param value - новое значение
   */
  function setCurrent(value: number | null): void {
    update((current) =>
      setCurrentHitPoints(current, value ?? 0, stats.value.hitPointsMax),
    );
  }

  /**
   * Записанный максимум или временные хиты.
   * @param field - поле
   * @param value - новое значение
   */
  function setHealth(
    field: Exclude<keyof SheetHealth, 'current'>,
    value: number | null,
  ): void {
    update((current) => ({
      ...current,
      health: { ...current.health, [field]: Math.max(0, value ?? 0) },
    }));
  }

  function applySuggestedMax(): void {
    setHealth('max', suggestedMax.value);
  }

  /**
   * Сдвигает число потраченных костей размера: трата без броска и возврат.
   * @param total - кости этого размера
   * @param delta - на сколько меняется число потраченных
   */
  function shiftUsed(total: HitDiceTotal, delta: number): void {
    update((current) => ({
      ...current,
      hitDiceUsed: {
        ...current.hitDiceUsed,
        [String(total.die)]: clamp(total.used + delta, 0, total.total),
      },
    }));
  }

  /**
   * Меняет дополнительную кость хитов.
   * @param id - строка
   * @param patch - изменённые поля
   */
  function patchExtra(id: string, patch: Partial<ExtraHitDie>): void {
    update((current) => ({
      ...current,
      extraHitDice: current.extraHitDice.map((extra) =>
        extra.id === id ? { ...extra, ...patch } : extra,
      ),
    }));
  }

  /**
   * Откуда кость.
   * @param id - строка
   * @param value - подпись
   */
  function setExtraName(id: string, value: string | number): void {
    patchExtra(id, { name: String(value) });
  }

  /**
   * Сколько костей.
   * @param id - строка
   * @param value - число костей
   */
  function setExtraCount(id: string, value: number | null): void {
    patchExtra(id, {
      count: clamp(
        Math.trunc(value ?? EXTRA_HIT_DICE_COUNT.min),
        EXTRA_HIT_DICE_COUNT.min,
        EXTRA_HIT_DICE_COUNT.max,
      ),
    });
  }

  /**
   * Размер кости.
   * @param id - строка
   * @param value - выбранный размер
   */
  function setExtraDie(id: string, value: unknown): void {
    const die = HIT_DIE_SIZES.find((size) => size === value);

    if (die) {
      patchExtra(id, { die });
    }
  }

  function addExtra(): void {
    update((current) => ({
      ...current,
      extraHitDice: [
        ...current.extraHitDice,
        {
          id: createSheetElementId(),
          name: '',
          die: HIT_DIE_SIZES[0],
          count: EXTRA_HIT_DICE_COUNT.min,
        },
      ],
    }));
  }

  /**
   * Убирает дополнительную кость.
   * @param id - строка
   */
  function removeExtra(id: string): void {
    update((current) => ({
      ...current,
      extraHitDice: current.extraHitDice.filter((extra) => extra.id !== id),
    }));
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.hitPoints"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-2">
          <UFormField :label="SHEET_LABELS.hitPointsCurrent">
            <UInputNumber
              :model-value="document.health.current"
              :min="0"
              class="w-full"
              @update:model-value="setCurrent"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.hitPointsMax">
            <UInputNumber
              :model-value="document.health.max"
              :min="0"
              class="w-full"
              @update:model-value="setHealth('max', $event)"
            />
          </UFormField>

          <UFormField :label="SHEET_LABELS.hitPointsTemporary">
            <UInputNumber
              :model-value="document.health.temporary"
              :min="0"
              class="w-full"
              @update:model-value="setHealth('temporary', $event)"
            />
          </UFormField>
        </div>

        <div
          v-if="isMaxChanged || isSuggestedVisible"
          class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-elevated/40 px-3 py-2"
        >
          <span
            v-if="isMaxChanged"
            class="text-xs text-muted"
          >
            {{ maxTotalLabel }}
          </span>

          <UButton
            v-if="isSuggestedVisible"
            :label="suggestedLabel"
            color="neutral"
            variant="link"
            size="xs"
            class="ml-auto"
            @click.left.exact.prevent="applySuggestedMax"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ HEALTH_TEXT.quickSteps }}
          </span>

          <SheetHitPointsControls size="sm" />
        </div>

        <SheetDeathSaves v-if="isDying" />

        <USeparator />

        <div class="flex flex-col gap-2">
          <span
            class="text-[10px] font-bold tracking-wider text-muted uppercase"
          >
            {{ SHEET_LABELS.hitDice }}
          </span>

          <div
            v-for="total in hitDice"
            :key="total.die"
            class="flex items-center gap-2 rounded bg-elevated/30 px-2 py-1.5"
          >
            <span class="w-10 text-sm font-bold text-highlighted">
              {{ total.label }}
            </span>

            <span class="text-xs text-muted">
              {{ HEALTH_TEXT.remaining }}

              <span class="font-bold text-highlighted">
                {{ total.remaining }}
              </span>

              / {{ total.total }}
            </span>

            <div class="ml-auto flex items-center gap-1">
              <UButton
                :icon="SHEET_ICON.minus"
                :aria-label="HEALTH_TEXT.spendDie"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :disabled="total.remaining <= 0"
                @click.left.exact.prevent="shiftUsed(total, 1)"
              />

              <UButton
                :icon="SHEET_ICON.plus"
                :aria-label="HEALTH_TEXT.restoreDie"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                :disabled="total.used <= 0"
                @click.left.exact.prevent="shiftUsed(total, -1)"
              />
            </div>
          </div>

          <span
            v-if="!hitDice.length"
            class="text-xs text-dimmed italic"
          >
            {{ HEALTH_TEXT.classDiceEmpty }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold tracking-wider text-muted uppercase"
            >
              {{ HEALTH_TEXT.extraDice }}
            </span>

            <UButton
              :icon="SHEET_ICON.add"
              :label="HEALTH_TEXT.extraDiceAdd"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.left.exact.prevent="addExtra"
            />
          </div>

          <div
            v-for="extra in document.extraHitDice"
            :key="extra.id"
            class="flex items-end gap-2"
          >
            <UFormField
              :label="HEALTH_TEXT.extraDiceName"
              class="min-w-0 grow"
            >
              <UInput
                :model-value="extra.name"
                :placeholder="HEALTH_TEXT.extraDiceNamePlaceholder"
                size="sm"
                class="w-full"
                @update:model-value="setExtraName(extra.id, $event)"
              />
            </UFormField>

            <UFormField
              :label="HEALTH_TEXT.extraDiceCount"
              class="w-24 shrink-0"
            >
              <UInputNumber
                :model-value="extra.count"
                :min="EXTRA_HIT_DICE_COUNT.min"
                :max="EXTRA_HIT_DICE_COUNT.max"
                size="sm"
                @update:model-value="setExtraCount(extra.id, $event)"
              />
            </UFormField>

            <UFormField
              :label="HEALTH_TEXT.extraDiceDie"
              class="w-20 shrink-0"
            >
              <USelect
                :model-value="extra.die"
                :items="dieItems"
                size="sm"
                class="w-full"
                @update:model-value="setExtraDie(extra.id, $event)"
              />
            </UFormField>

            <UButton
              :icon="SHEET_ICON.remove"
              :aria-label="SHEET_LABELS.remove"
              color="error"
              variant="ghost"
              size="sm"
              @click.left.exact.prevent="removeExtra(extra.id)"
            />
          </div>

          <p class="text-xs text-dimmed">{{ HEALTH_TEXT.extraDiceHint }}</p>
        </div>
      </div>
    </template>
  </UModal>
</template>
