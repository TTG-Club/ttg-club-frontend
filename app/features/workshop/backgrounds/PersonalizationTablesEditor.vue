<script setup lang="ts">
  import type { PersonalizationTable, SelectOption } from '../model';

  import { WorkshopListSection } from '../form';
  import {
    findFreePersonalizationType,
    PERSONALIZATION_ICON,
    PERSONALIZATION_ROW_ROWS,
    PERSONALIZATION_TEXT,
    PERSONALIZATION_TYPE_OPTIONS,
  } from '../model';

  /** Вариант выбора таблицы: занятые другими таблицами недоступны. */
  interface TypeItem extends SelectOption {
    disabled: boolean;
  }

  /** Таблицы персонализации предыстории: тип и строки по порядку броска. */
  const tables = defineModel<Array<PersonalizationTable>>({ required: true });

  const freeType = computed(() => findFreePersonalizationType(tables.value));

  /**
   * Заменяет таблицу по номеру.
   * @param tableIndex - номер таблицы
   * @param update - новые поля таблицы
   */
  function patchTable(
    tableIndex: number,
    update: Partial<PersonalizationTable>,
  ): void {
    tables.value = tables.value.map((table, index) =>
      index === tableIndex ? { ...table, ...update } : table,
    );
  }

  function addTable(): void {
    if (!freeType.value) {
      return;
    }

    tables.value = [...tables.value, { type: freeType.value, values: [''] }];
  }

  /**
   * Удаляет таблицу.
   * @param tableIndex - номер таблицы
   */
  function removeTable(tableIndex: number): void {
    tables.value = tables.value.filter((_, index) => index !== tableIndex);
  }

  /**
   * Типы для выбора: занятые другими таблицами недоступны.
   * @param tableIndex - номер таблицы
   */
  function getTypeItems(tableIndex: number): Array<TypeItem> {
    const current = tables.value[tableIndex]?.type;

    return PERSONALIZATION_TYPE_OPTIONS.map((option) => ({
      ...option,
      disabled:
        option.value !== current
        && tables.value.some((table) => table.type === option.value),
    }));
  }

  /**
   * Меняет тип таблицы.
   * @param tableIndex - номер таблицы
   * @param type - код типа
   */
  function changeType(tableIndex: number, type: string): void {
    patchTable(tableIndex, { type });
  }

  /**
   * Добавляет пустую строку в конец таблицы.
   * @param tableIndex - номер таблицы
   */
  function addRow(tableIndex: number): void {
    const values = tables.value[tableIndex]?.values ?? [];

    patchTable(tableIndex, { values: [...values, ''] });
  }

  /**
   * Меняет текст строки.
   * @param tableIndex - номер таблицы
   * @param rowIndex - номер строки
   * @param value - новый текст
   */
  function changeRow(
    tableIndex: number,
    rowIndex: number,
    value: string,
  ): void {
    const values = tables.value[tableIndex]?.values ?? [];

    patchTable(tableIndex, {
      values: values.map((current, index) =>
        index === rowIndex ? value : current,
      ),
    });
  }

  /**
   * Удаляет строку таблицы.
   * @param tableIndex - номер таблицы
   * @param rowIndex - номер строки
   */
  function removeRow(tableIndex: number, rowIndex: number): void {
    const values = tables.value[tableIndex]?.values ?? [];

    patchTable(tableIndex, {
      values: values.filter((_, index) => index !== rowIndex),
    });
  }

  /**
   * Имя поля строки: по нему форма показывает ошибку проверки.
   * @param tableIndex - номер таблицы
   * @param rowIndex - номер строки
   */
  function getRowFieldName(tableIndex: number, rowIndex: number): string {
    return `personalizationTables.${tableIndex}.values.${rowIndex}`;
  }

  /**
   * Номер строки в таблице — результат броска.
   * @param rowIndex - индекс строки
   */
  function getRowNumber(rowIndex: number): number {
    return rowIndex + 1;
  }
</script>

<template>
  <WorkshopListSection
    :title="PERSONALIZATION_TEXT.title"
    :description="PERSONALIZATION_TEXT.description"
    :add-label="PERSONALIZATION_TEXT.addTable"
    :add-icon="PERSONALIZATION_ICON.add"
    :is-add-disabled="!freeType"
    :is-empty="!tables.length"
    :empty-text="PERSONALIZATION_TEXT.empty"
    @add="addTable"
  >
    <UCard
      v-for="(table, tableIndex) in tables"
      :key="table.type"
      :ui="{ body: 'flex flex-col gap-3 p-3 sm:p-4' }"
    >
      <div class="flex flex-wrap items-end gap-3">
        <UFormField
          :label="PERSONALIZATION_TEXT.type"
          class="min-w-56 flex-1"
        >
          <USelect
            :model-value="table.type"
            :items="getTypeItems(tableIndex)"
            class="w-full"
            @update:model-value="changeType(tableIndex, $event)"
          />
        </UFormField>

        <UButton
          :label="PERSONALIZATION_TEXT.removeTable"
          :icon="PERSONALIZATION_ICON.remove"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="removeTable(tableIndex)"
        />
      </div>

      <UFormField
        v-for="(value, rowIndex) in table.values"
        :key="rowIndex"
        :name="getRowFieldName(tableIndex, rowIndex)"
      >
        <div class="flex items-start gap-2">
          <span class="w-6 shrink-0 pt-1.5 text-right text-sm text-muted">
            {{ getRowNumber(rowIndex) }}
          </span>

          <UTextarea
            :model-value="value"
            :rows="PERSONALIZATION_ROW_ROWS"
            class="min-w-0 flex-1"
            autoresize
            @update:model-value="changeRow(tableIndex, rowIndex, $event)"
          />

          <UButton
            :aria-label="PERSONALIZATION_TEXT.removeRow"
            :icon="PERSONALIZATION_ICON.remove"
            :disabled="table.values.length === 1"
            color="neutral"
            variant="ghost"
            @click.left.exact.prevent="removeRow(tableIndex, rowIndex)"
          />
        </div>
      </UFormField>

      <div>
        <UButton
          :label="PERSONALIZATION_TEXT.addRow"
          :icon="PERSONALIZATION_ICON.add"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="addRow(tableIndex)"
        />
      </div>
    </UCard>
  </WorkshopListSection>
</template>
