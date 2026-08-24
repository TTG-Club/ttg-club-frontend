<script setup lang="ts">
  import type { ClassTableColumn } from '@/shared/types/character/Classes';

  import {
    CLASS_LEVELS,
    EMPTY_CLASS_TABLE_VALUE,
    INFINITE_CLASS_TABLE_VALUE,
    MAX_CLASS_TABLE_VALUE,
  } from './constants';

  defineOptions({
    name: 'ClassTableEditor',
  });

  const props = defineProps<{
    modelValue: ClassTableColumn[];
  }>();

  const emit = defineEmits<{
    (event: 'update:modelValue', value: ClassTableColumn[]): void;
  }>();

  const createColumn = (): ClassTableColumn => ({
    name: '',
    prefix: '',
    suffix: '',
    levels: CLASS_LEVELS.map(() => EMPTY_CLASS_TABLE_VALUE),
  });

  const addColumn = () => {
    emit('update:modelValue', [...props.modelValue, createColumn()]);
  };

  const removeColumn = (columnIndex: number) => {
    emit(
      'update:modelValue',
      props.modelValue.filter((_, index) => index !== columnIndex),
    );
  };

  const updateColumn = (
    columnIndex: number,
    field: 'name' | 'prefix' | 'suffix',
    value: string,
  ) => {
    emit(
      'update:modelValue',
      props.modelValue.map((column, index) =>
        index === columnIndex ? { ...column, [field]: value } : column,
      ),
    );
  };

  const updateLevel = (
    columnIndex: number,
    levelIndex: number,
    value: number | null,
  ) => {
    emit(
      'update:modelValue',
      props.modelValue.map((column, index) =>
        index === columnIndex
          ? {
              ...column,
              levels: column.levels.map((levelValue, currentLevelIndex) =>
                currentLevelIndex === levelIndex ? value : levelValue,
              ),
            }
          : column,
      ),
    );
  };
</script>

<template>
  <section class="class-table-editor">
    <div class="class-table-editor__header">
      <div>
        <h3>Таблица прогрессии</h3>

        <p>
          Значение {{ EMPTY_CLASS_TABLE_VALUE }} отображается как «—», а
          {{ INFINITE_CLASS_TABLE_VALUE }} — как «∞».
        </p>
      </div>

      <button
        type="button"
        @click="addColumn"
      >
        Добавить колонку
      </button>
    </div>

    <article
      v-for="(column, columnIndex) in modelValue"
      :key="column.id || columnIndex"
      class="class-table-editor__column"
    >
      <div class="class-table-editor__column-header">
        <h4>Колонка {{ columnIndex + 1 }}</h4>

        <button
          type="button"
          @click="removeColumn(columnIndex)"
        >
          Удалить
        </button>
      </div>

      <div class="class-table-editor__settings">
        <label>
          <span>Название</span>

          <n-input
            :value="column.name"
            required
            @update:value="updateColumn(columnIndex, 'name', $event)"
          />
        </label>

        <label>
          <span>Префикс значения</span>

          <n-input
            :value="column.prefix"
            @update:value="updateColumn(columnIndex, 'prefix', $event)"
          />
        </label>

        <label>
          <span>Суффикс значения</span>

          <n-input
            :value="column.suffix"
            @update:value="updateColumn(columnIndex, 'suffix', $event)"
          />
        </label>
      </div>

      <div class="class-table-editor__levels">
        <label
          v-for="(level, levelIndex) in CLASS_LEVELS"
          :key="level"
        >
          <span>{{ level }} ур.</span>

          <n-input-number
            :max="MAX_CLASS_TABLE_VALUE"
            :min="INFINITE_CLASS_TABLE_VALUE"
            :show-button="false"
            :value="column.levels[levelIndex]"
            @update:value="updateLevel(columnIndex, levelIndex, $event)"
          />
        </label>
      </div>
    </article>

    <p
      v-if="!modelValue.length"
      class="class-table-editor__empty"
    >
      Дополнительные колонки не добавлены.
    </p>
  </section>
</template>

<style lang="scss" scoped>
  .class-table-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 16px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    &__header,
    &__column-header {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      h3,
      h4,
      p {
        margin: 0;
      }

      p {
        margin-top: 4px;
        color: var(--text-color);
      }
    }

    button {
      cursor: pointer;

      min-height: 36px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--primary);
      border: 0;
      border-radius: 8px;
    }

    &__column {
      display: flex;
      flex-direction: column;
      gap: 12px;

      padding: 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__column-header button {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border);
    }

    &__settings,
    &__levels {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 10px;

      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      span {
        color: var(--text-color);
      }
    }

    &__empty {
      margin: 0;
      color: var(--text-color);
    }

    @media (min-width: 600px) {
      &__settings {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      &__levels {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (min-width: 1000px) {
      &__levels {
        grid-template-columns: repeat(10, minmax(0, 1fr));
      }
    }
  }
</style>
