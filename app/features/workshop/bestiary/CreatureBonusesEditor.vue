<script setup lang="ts">
  import type { CreatureBonus, SelectOption } from '../model';

  import {
    createCreatureBonus,
    CREATURE_BONUS_TEXT,
    CREATURE_LIST_ICON,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Спасброски или навыки существа: код, бонус и дополнение. */
  const { title, field, keyLabel, options, emptyText } = defineProps<{
    title: string;
    /** Поле формы: по нему показываются ошибки проверки. */
    field: 'savingThrows' | 'skills';
    keyLabel: string;
    options: ReadonlyArray<SelectOption>;
    emptyText: string;
  }>();

  const bonuses = defineModel<Array<CreatureBonus>>({ required: true });

  /**
   * Варианты строки: уже выбранные в других строках недоступны.
   * @param bonusIndex - номер строки
   */
  function getItems(
    bonusIndex: number,
  ): Array<SelectOption & { disabled: boolean }> {
    return options.map((option) => ({
      ...option,
      disabled: bonuses.value.some(
        (bonus, index) => index !== bonusIndex && bonus.key === option.value,
      ),
    }));
  }

  /**
   * Заменяет строку по номеру.
   * @param bonusIndex - номер строки
   * @param update - новые поля строки
   */
  function patchBonus(
    bonusIndex: number,
    update: Partial<CreatureBonus>,
  ): void {
    bonuses.value = bonuses.value.map((bonus, index) =>
      index === bonusIndex ? { ...bonus, ...update } : bonus,
    );
  }

  function addBonus(): void {
    bonuses.value = [...bonuses.value, createCreatureBonus()];
  }

  /**
   * Удаляет строку.
   * @param bonusIndex - номер строки
   */
  function removeBonus(bonusIndex: number): void {
    bonuses.value = bonuses.value.filter((_, index) => index !== bonusIndex);
  }

  /**
   * Меняет характеристику или навык.
   * @param bonusIndex - номер строки
   * @param key - код характеристики или навыка
   */
  function changeKey(bonusIndex: number, key: string): void {
    patchBonus(bonusIndex, { key });
  }

  /**
   * Меняет бонус.
   * @param bonusIndex - номер строки
   * @param value - бонус; пустое поле — ноль
   */
  function changeValue(bonusIndex: number, value: number | null): void {
    patchBonus(bonusIndex, { value: value ?? 0 });
  }

  /**
   * Меняет дополнение к бонусу.
   * @param bonusIndex - номер строки
   * @param additional - текст дополнения
   */
  function changeAdditional(bonusIndex: number, additional: string): void {
    patchBonus(bonusIndex, { additional });
  }

  /**
   * Имя поля строки: по нему форма показывает ошибку проверки.
   * @param bonusIndex - номер строки
   * @param key - поле строки
   */
  function getFieldName(bonusIndex: number, key: keyof CreatureBonus): string {
    return `${field}.${bonusIndex}.${key}`;
  }
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-semibold text-highlighted">
        {{ title }}
      </h3>

      <UButton
        :label="CREATURE_BONUS_TEXT.add"
        :icon="CREATURE_LIST_ICON.add"
        color="neutral"
        variant="outline"
        @click.left.exact.prevent="addBonus"
      />
    </div>

    <div
      v-for="(bonus, bonusIndex) in bonuses"
      :key="bonusIndex"
      class="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)_auto]"
    >
      <UFormField
        :label="keyLabel"
        :name="getFieldName(bonusIndex, 'key')"
        required
      >
        <USelect
          :model-value="bonus.key"
          :items="getItems(bonusIndex)"
          :placeholder="WORKSHOP_FIELD_TEXT.selectPlaceholder"
          class="w-full"
          @update:model-value="changeKey(bonusIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="CREATURE_BONUS_TEXT.value"
        :name="getFieldName(bonusIndex, 'value')"
        required
      >
        <UInputNumber
          :model-value="bonus.value"
          class="w-full"
          @update:model-value="changeValue(bonusIndex, $event)"
        />
      </UFormField>

      <UFormField
        :label="CREATURE_BONUS_TEXT.additional"
        :name="getFieldName(bonusIndex, 'additional')"
      >
        <UInput
          :model-value="bonus.additional"
          class="w-full"
          @update:model-value="changeAdditional(bonusIndex, $event)"
        />
      </UFormField>

      <UButton
        :aria-label="CREATURE_BONUS_TEXT.remove"
        :icon="CREATURE_LIST_ICON.remove"
        class="sm:mt-6"
        color="error"
        variant="ghost"
        @click.left.exact.prevent="removeBonus(bonusIndex)"
      />
    </div>

    <UEmpty
      v-if="!bonuses.length"
      :icon="CREATURE_LIST_ICON.empty"
      :title="emptyText"
      variant="naked"
    />
  </section>
</template>
