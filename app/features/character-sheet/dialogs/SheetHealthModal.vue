<script setup lang="ts">
  import type { DeathSaves, HitDiceTotal, SheetHealth } from '../model';

  import { range } from 'es-toolkit';

  import {
    useCharacterSheet,
    useSheetRoll,
    useSheetStats,
  } from '../composables';
  import {
    applyDamage,
    applyHealing,
    DEATH_SAVES_MAX,
    getAbilityModifier,
    getDiceFormula,
    getHitDiceTotals,
    getSuggestedMaxHitPoints,
    SHEET_ICON,
    SHEET_LABELS,
  } from '../model';

  /**
   * Правка хитов: текущие, записанный максимум (механика и эффекты
   * прибавляются сверху), временные, урон и лечение, кости хитов и
   * спасброски от смерти.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();
  const { stats } = useSheetStats();
  const { rollFormula } = useSheetRoll();

  const amount = ref<number | null>(null);

  const hitDice = computed(() => getHitDiceTotals(document.value));

  const suggestedMax = computed(() => getSuggestedMaxHitPoints(document.value));

  const maxHint = computed(() =>
    stats.value.hitPointsMax === document.value.health.max
      ? ''
      : `= ${stats.value.hitPointsMax}`,
  );

  const deathSaveSlots = range(DEATH_SAVES_MAX);

  const isDying = computed(
    () => stats.value.hitPointsMax > 0 && document.value.health.current === 0,
  );

  /**
   * Меняет поле хитов; текущие не выше максимума с механикой.
   * @param field - поле
   * @param value - новое значение
   */
  function setHealth(field: keyof SheetHealth, value: number | null): void {
    const limit = stats.value.hitPointsMax;

    update((current) => {
      const health = { ...current.health, [field]: Math.max(0, value ?? 0) };

      return {
        ...current,
        health: {
          ...health,
          current:
            field === 'current' && limit
              ? Math.min(health.current, limit)
              : health.current,
        },
      };
    });
  }

  function applySuggestedMax(): void {
    setHealth('max', suggestedMax.value);
  }

  function damage(): void {
    const value = amount.value;

    if (value && value > 0) {
      update((current) => applyDamage(current, value));
      amount.value = null;
    }
  }

  function heal(): void {
    const value = amount.value;
    const limit = stats.value.hitPointsMax;

    if (value && value > 0) {
      update((current) => {
        const healed = applyHealing(current, value);

        return {
          ...healed,
          health: {
            ...healed.health,
            current: Math.min(current.health.current + value, limit),
          },
        };
      });

      amount.value = null;
    }
  }

  /**
   * Тратит кость хитов: бросок с модификатором Телосложения лечит.
   * @param total - кости этого размера
   */
  function spendHitDie(total: HitDiceTotal): void {
    if (total.used >= total.total) {
      return;
    }

    const healed = Math.max(
      0,
      rollFormula(
        SHEET_LABELS.hitDice,
        getDiceFormula(
          total.die,
          getAbilityModifier(stats.value.abilities.CONSTITUTION),
        ),
      ),
    );

    const limit = stats.value.hitPointsMax;

    update((current) => ({
      ...current,
      hitDiceUsed: {
        ...current.hitDiceUsed,
        [String(total.die)]: total.used + 1,
      },
      health: {
        ...current.health,
        current: Math.min(current.health.current + healed, limit),
      },
    }));
  }

  /**
   * Возвращает потраченную кость хитов.
   * @param total - кости этого размера
   */
  function restoreHitDie(total: HitDiceTotal): void {
    update((current) => ({
      ...current,
      hitDiceUsed: {
        ...current.hitDiceUsed,
        [String(total.die)]: Math.max(0, total.used - 1),
      },
    }));
  }

  /**
   * Отмечает спасбросок от смерти: клик по отмеченной клетке снимает отметку.
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

  /**
   * Класс клетки спасброска от смерти.
   * @param field - успехи или провалы
   * @param index - номер клетки
   */
  function getDeathSaveClass(field: keyof DeathSaves, index: number): string {
    if (document.value.deathSaves[field] <= index) {
      return 'border-default';
    }

    return field === 'successes'
      ? 'border-success bg-success'
      : 'border-error bg-error';
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="SHEET_LABELS.hitPoints"
    :ui="{ content: 'max-w-md', body: 'flex flex-col gap-4' }"
  >
    <template #body>
      <div class="grid grid-cols-3 gap-2">
        <UFormField :label="SHEET_LABELS.hitPointsCurrent">
          <UInputNumber
            :model-value="document.health.current"
            :min="0"
            class="w-full"
            @update:model-value="setHealth('current', $event)"
          />
        </UFormField>

        <UFormField
          :label="SHEET_LABELS.hitPointsMax"
          :hint="maxHint"
        >
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

      <UButton
        v-if="suggestedMax && suggestedMax !== document.health.max"
        :label="`${SHEET_LABELS.hitPointsMax}: ${suggestedMax}`"
        color="neutral"
        variant="link"
        size="xs"
        class="self-start"
        @click.left.exact.prevent="applySuggestedMax"
      />

      <div class="flex items-center gap-2">
        <UInputNumber
          v-model="amount"
          :min="0"
          class="w-28"
          placeholder="0"
        />

        <UButton
          :label="SHEET_LABELS.damage"
          :icon="SHEET_ICON.minus"
          color="error"
          variant="subtle"
          @click.left.exact.prevent="damage"
        />

        <UButton
          :label="SHEET_LABELS.heal"
          :icon="SHEET_ICON.plus"
          color="success"
          variant="subtle"
          @click.left.exact.prevent="heal"
        />
      </div>

      <div
        v-if="hitDice.length"
        class="flex flex-col gap-1"
      >
        <span class="text-xs text-muted uppercase">{{
          SHEET_LABELS.hitDice
        }}</span>

        <div
          v-for="total in hitDice"
          :key="total.die"
          class="flex items-center gap-2"
        >
          <span class="w-12 font-semibold text-highlighted"
            >к{{ total.die }}</span
          >

          <span class="flex-1 text-sm tabular-nums">
            {{ total.total - total.used }} / {{ total.total }}
          </span>

          <UButton
            :icon="SHEET_ICON.plus"
            :aria-label="SHEET_LABELS.used"
            color="neutral"
            variant="ghost"
            size="xs"
            :disabled="total.used === 0"
            @click.left.exact.prevent="restoreHitDie(total)"
          />

          <UButton
            :icon="SHEET_ICON.dice"
            :label="SHEET_LABELS.heal"
            color="neutral"
            variant="subtle"
            size="xs"
            :disabled="total.used >= total.total"
            @click.left.exact.prevent="spendHitDie(total)"
          />
        </div>
      </div>

      <div
        v-if="isDying"
        class="flex flex-col gap-1"
      >
        <span class="text-xs text-muted uppercase">{{
          SHEET_LABELS.deathSaves
        }}</span>

        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-1">
            <span class="mr-1 text-muted">{{ SHEET_LABELS.successes }}</span>

            <button
              v-for="index in deathSaveSlots"
              :key="`success-${index}`"
              type="button"
              class="size-4 rounded-full border-2"
              :class="getDeathSaveClass('successes', index)"
              :aria-label="SHEET_LABELS.successes"
              @click.left.exact.prevent="setDeathSave('successes', index)"
            />
          </div>

          <div class="flex items-center gap-1">
            <span class="mr-1 text-muted">{{ SHEET_LABELS.failures }}</span>

            <button
              v-for="index in deathSaveSlots"
              :key="`failure-${index}`"
              type="button"
              class="size-4 rounded-full border-2"
              :class="getDeathSaveClass('failures', index)"
              :aria-label="SHEET_LABELS.failures"
              @click.left.exact.prevent="setDeathSave('failures', index)"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
