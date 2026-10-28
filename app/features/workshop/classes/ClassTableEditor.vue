<script setup lang="ts">
  import type { ClassTableColumn } from '../model';

  import { WorkshopListSection } from '../form';
  import {
    CLASS_LEVELS,
    CLASS_LIST_ICON,
    CLASS_TABLE_TEXT,
    createClassTableColumn,
    INFINITE_CLASS_TABLE_VALUE,
    MAX_CLASS_TABLE_VALUE,
    WORKSHOP_FIELD_TEXT,
  } from '../model';

  /** Колонки таблицы прогрессии класса или архетипа. */
  const { fieldName } = defineProps<{
    /** Поле формы со списком колонок: по нему показываются ошибки. */
    fieldName: string;
  }>();

  const columns = defineModel<Array<ClassTableColumn>>({ required: true });

  /**
   * Заменяет колонку по номеру.
   * @param columnIndex - номер колонки
   * @param update - новые поля колонки
   */
  function patchColumn(
    columnIndex: number,
    update: Partial<ClassTableColumn>,
  ): void {
    columns.value = columns.value.map((column, index) =>
      index === columnIndex ? { ...column, ...update } : column,
    );
  }

  function addColumn(): void {
    columns.value = [...columns.value, createClassTableColumn()];
  }

  /**
   * Удаляет колонку.
   * @param columnIndex - номер колонки
   */
  function removeColumn(columnIndex: number): void {
    columns.value = columns.value.filter((_, index) => index !== columnIndex);
  }

  /**
   * Меняет название колонки.
   * @param columnIndex - номер колонки
   * @param name - название
   */
  function changeName(columnIndex: number, name: string): void {
    patchColumn(columnIndex, { name });
  }

  /**
   * Меняет префикс значений колонки.
   * @param columnIndex - номер колонки
   * @param prefix - префикс
   */
  function changePrefix(columnIndex: number, prefix: string): void {
    patchColumn(columnIndex, { prefix });
  }

  /**
   * Меняет суффикс значений колонки.
   * @param columnIndex - номер колонки
   * @param suffix - суффикс
   */
  function changeSuffix(columnIndex: number, suffix: string): void {
    patchColumn(columnIndex, { suffix });
  }

  /**
   * Меняет значение колонки на уровне.
   * @param columnIndex - номер колонки
   * @param levelIndex - номер уровня
   * @param value - значение ячейки
   */
  function changeLevel(
    columnIndex: number,
    levelIndex: number,
    value: number | null,
  ): void {
    const levels = columns.value[columnIndex]?.levels ?? [];

    patchColumn(columnIndex, {
      levels: levels.map((current, index) =>
        index === levelIndex ? value : current,
      ),
    });
  }

  /**
   * Имя поля колонки: по нему форма показывает ошибку проверки.
   * @param columnIndex - номер колонки
   * @param field - поле колонки
   */
  function getFieldName(
    columnIndex: number,
    field: keyof ClassTableColumn,
  ): string {
    return `${fieldName}.${columnIndex}.${field}`;
  }

  /**
   * Имя ячейки уровня.
   * @param columnIndex - номер колонки
   * @param levelIndex - номер уровня
   */
  function getLevelFieldName(columnIndex: number, levelIndex: number): string {
    return `${getFieldName(columnIndex, 'levels')}.${levelIndex}`;
  }

  /**
   * Заголовок колонки: «Колонка 1».
   * @param columnIndex - номер колонки
   */
  function getColumnTitle(columnIndex: number): string {
    return `${CLASS_TABLE_TEXT.column} ${columnIndex + 1}`;
  }

  /**
   * Подпись уровня: «5 ур.».
   * @param level - уровень
   */
  function getLevelLabel(level: number): string {
    return `${level} ${CLASS_TABLE_TEXT.levelSuffix}`;
  }

  /**
   * Ключ колонки: сохранённые различаются идентификатором.
   * @param column - колонка
   * @param columnIndex - номер колонки
   */
  function getColumnKey(column: ClassTableColumn, columnIndex: number): string {
    return column.id ? String(column.id) : `new-${columnIndex}`;
  }
</script>

<template>
  <WorkshopListSection
    :title="CLASS_TABLE_TEXT.title"
    :description="CLASS_TABLE_TEXT.description"
    :add-label="CLASS_TABLE_TEXT.add"
    :add-icon="CLASS_LIST_ICON.add"
    :is-empty="!columns.length"
    :empty-text="CLASS_TABLE_TEXT.empty"
    @add="addColumn"
  >
    <UCard
      v-for="(column, columnIndex) in columns"
      :key="getColumnKey(column, columnIndex)"
      :ui="{ body: 'flex flex-col gap-3 p-3 sm:p-4' }"
    >
      <div class="flex items-center justify-between gap-3">
        <h4 class="text-sm font-semibold text-highlighted">
          {{ getColumnTitle(columnIndex) }}
        </h4>

        <UButton
          :label="CLASS_TABLE_TEXT.remove"
          :icon="CLASS_LIST_ICON.remove"
          color="error"
          variant="ghost"
          @click.left.exact.prevent="removeColumn(columnIndex)"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <UFormField
          :label="WORKSHOP_FIELD_TEXT.name"
          :name="getFieldName(columnIndex, 'name')"
          required
        >
          <UInput
            :model-value="column.name"
            class="w-full"
            @update:model-value="changeName(columnIndex, $event)"
          />
        </UFormField>

        <UFormField
          :label="CLASS_TABLE_TEXT.prefix"
          :name="getFieldName(columnIndex, 'prefix')"
        >
          <UInput
            :model-value="column.prefix"
            class="w-full"
            @update:model-value="changePrefix(columnIndex, $event)"
          />
        </UFormField>

        <UFormField
          :label="CLASS_TABLE_TEXT.suffix"
          :name="getFieldName(columnIndex, 'suffix')"
        >
          <UInput
            :model-value="column.suffix"
            class="w-full"
            @update:model-value="changeSuffix(columnIndex, $event)"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        <UFormField
          v-for="(level, levelIndex) in CLASS_LEVELS"
          :key="level"
          :label="getLevelLabel(level)"
          :name="getLevelFieldName(columnIndex, levelIndex)"
          :ui="{ label: 'text-xs text-muted' }"
        >
          <UInputNumber
            :model-value="column.levels[levelIndex]"
            :min="INFINITE_CLASS_TABLE_VALUE"
            :max="MAX_CLASS_TABLE_VALUE"
            :increment="false"
            :decrement="false"
            class="w-full"
            @update:model-value="changeLevel(columnIndex, levelIndex, $event)"
          />
        </UFormField>
      </div>
    </UCard>
  </WorkshopListSection>
</template>
