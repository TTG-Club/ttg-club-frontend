<script setup lang="ts">
  import type { CustomBonus, CustomBonusContext, SheetClass } from '../model';

  import {
    CUSTOM_BONUS_FORMAT_OPTIONS,
    CUSTOM_BONUS_LABEL_MAX_LENGTH,
    CUSTOM_BONUS_RANGE,
    CUSTOM_BONUS_TEXT,
    formatModifier,
    getCustomBonusSource,
    getCustomBonusSourceOptions,
    getCustomBonusValue,
    withCustomBonusSource,
  } from '../model';

  /**
   * Строки дополнительных бонусов навыка: подпись, источник и величина. Своё
   * число вводится, остальное (модификатор, мастерство, уровни) лист считает
   * сам и показывает готовым значением.
   */
  const { classes, context } = defineProps<{
    classes: ReadonlyArray<Pick<SheetClass, 'id' | 'name'>>;
    context: CustomBonusContext;
  }>();

  const rows = defineModel<Array<CustomBonus>>({ required: true });

  const sourceOptions = computed(() => getCustomBonusSourceOptions(classes));

  /**
   * Посчитанная величина бонуса со знаком.
   * @param bonus - бонус
   */
  function getComputedValue(bonus: CustomBonus): string {
    return formatModifier(getCustomBonusValue(bonus, context));
  }

  /**
   * Меняет источник бонуса.
   * @param id - бонус
   * @param source - выбранный источник
   */
  function setSource(id: string, source: unknown): void {
    if (typeof source !== 'string') {
      return;
    }

    rows.value = rows.value.map((row) =>
      row.id === id ? withCustomBonusSource(row, source) : row,
    );
  }

  /**
   * Удаляет бонус.
   * @param id - бонус
   */
  function remove(id: string): void {
    rows.value = rows.value.filter((row) => row.id !== id);
  }
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="row in rows"
      :key="row.id"
      class="flex flex-wrap items-center gap-2"
    >
      <UInput
        v-model="row.label"
        :maxlength="CUSTOM_BONUS_LABEL_MAX_LENGTH"
        :placeholder="CUSTOM_BONUS_TEXT.labelPlaceholder"
        size="sm"
        class="min-w-0 grow basis-40"
      />

      <USelect
        :model-value="getCustomBonusSource(row)"
        :items="sourceOptions"
        :placeholder="CUSTOM_BONUS_TEXT.sourcePlaceholder"
        size="sm"
        class="min-w-0 grow basis-32"
        @update:model-value="setSource(row.id, $event)"
      />

      <UInputNumber
        v-if="row.kind === 'flat'"
        v-model="row.value"
        :min="CUSTOM_BONUS_RANGE.min"
        :max="CUSTOM_BONUS_RANGE.max"
        :format-options="CUSTOM_BONUS_FORMAT_OPTIONS"
        size="sm"
        class="w-28 shrink-0"
      />

      <!-- Коробка того же размера, что и поле: колонка значений не едет -->
      <span
        v-else
        class="w-28 shrink-0 rounded-md border border-default/50 bg-elevated/40 px-2 py-1 text-center text-sm font-semibold text-toned tabular-nums"
      >
        {{ getComputedValue(row) }}
      </span>

      <UTooltip :text="CUSTOM_BONUS_TEXT.remove">
        <UButton
          icon="tabler:trash"
          color="error"
          variant="ghost"
          size="xs"
          square
          class="shrink-0"
          :aria-label="CUSTOM_BONUS_TEXT.remove"
          @click.left.exact.prevent="remove(row.id)"
        />
      </UTooltip>
    </div>
  </div>
</template>
