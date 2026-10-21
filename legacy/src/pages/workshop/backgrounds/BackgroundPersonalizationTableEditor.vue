<script setup lang="ts">
  import type {
    BackgroundPersonalizationTableSave,
    BackgroundPersonalizationType,
  } from '@/shared/types/character/Backgrounds';

  import { PERSONALIZATION_TYPE_OPTIONS } from './constants';

  defineOptions({
    name: 'BackgroundPersonalizationTableEditor',
  });

  const props = defineProps<{
    modelValue: BackgroundPersonalizationTableSave[];
  }>();

  const emit = defineEmits<{
    (
      event: 'update:modelValue',
      value: BackgroundPersonalizationTableSave[],
    ): void;
  }>();

  const usedTypes = computed(() => props.modelValue.map((table) => table.type));

  const availableType = computed(() =>
    PERSONALIZATION_TYPE_OPTIONS.find(
      (option) => !usedTypes.value.includes(option.value),
    ),
  );

  const addTable = () => {
    if (!availableType.value) {
      return;
    }

    emit('update:modelValue', [
      ...props.modelValue,
      { type: availableType.value.value, values: [''] },
    ]);
  };

  const removeTable = (tableIndex: number) => {
    emit(
      'update:modelValue',
      props.modelValue.filter((_, index) => index !== tableIndex),
    );
  };

  const updateTableType = (
    tableIndex: number,
    type: BackgroundPersonalizationType,
  ) => {
    emit(
      'update:modelValue',
      props.modelValue.map((table, index) =>
        index === tableIndex ? { ...table, type } : table,
      ),
    );
  };

  const typeOptions = (tableIndex: number) =>
    PERSONALIZATION_TYPE_OPTIONS.map((option) => ({
      ...option,
      disabled:
        props.modelValue[tableIndex].type !== option.value &&
        usedTypes.value.includes(option.value),
    }));

  const addValue = (tableIndex: number) => {
    emit(
      'update:modelValue',
      props.modelValue.map((table, index) =>
        index === tableIndex
          ? { ...table, values: [...table.values, ''] }
          : table,
      ),
    );
  };

  const updateValue = (
    tableIndex: number,
    valueIndex: number,
    value: string,
  ) => {
    emit(
      'update:modelValue',
      props.modelValue.map((table, index) =>
        index === tableIndex
          ? {
              ...table,
              values: table.values.map((currentValue, currentIndex) =>
                currentIndex === valueIndex ? value : currentValue,
              ),
            }
          : table,
      ),
    );
  };

  const removeValue = (tableIndex: number, valueIndex: number) => {
    emit(
      'update:modelValue',
      props.modelValue.map((table, index) =>
        index === tableIndex
          ? {
              ...table,
              values: table.values.filter(
                (_, currentIndex) => currentIndex !== valueIndex,
              ),
            }
          : table,
      ),
    );
  };
</script>

<template>
  <section class="personalization-table-editor">
    <div class="personalization-table-editor__header">
      <div>
        <h3>Таблицы персонализации</h3>

        <p>Порядковый номер строки используется как результат броска.</p>
      </div>

      <button
        :disabled="!availableType"
        type="button"
        @click="addTable"
      >
        Добавить таблицу
      </button>
    </div>

    <article
      v-for="(table, tableIndex) in modelValue"
      :key="table.type"
      class="personalization-table-editor__table"
    >
      <div class="personalization-table-editor__table-header">
        <n-select
          :options="typeOptions(tableIndex)"
          :value="table.type"
          @update:value="updateTableType(tableIndex, $event)"
        />

        <button
          type="button"
          @click="removeTable(tableIndex)"
        >
          Удалить таблицу
        </button>
      </div>

      <div class="personalization-table-editor__values">
        <label
          v-for="(value, valueIndex) in table.values"
          :key="valueIndex"
        >
          <span>{{ valueIndex + 1 }}</span>

          <n-input
            :value="value"
            required
            type="textarea"
            @update:value="updateValue(tableIndex, valueIndex, $event)"
          />

          <button
            :disabled="table.values.length === 1"
            type="button"
            @click="removeValue(tableIndex, valueIndex)"
          >
            Удалить
          </button>
        </label>
      </div>

      <button
        class="personalization-table-editor__add-value"
        type="button"
        @click="addValue(tableIndex)"
      >
        Добавить строку
      </button>
    </article>

    <p
      v-if="!modelValue.length"
      class="personalization-table-editor__empty"
    >
      Таблицы не добавлены.
    </p>
  </section>
</template>

<style lang="scss" scoped>
  .personalization-table-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 16px;

    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;

    &__header,
    &__table-header,
    &__values label {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    &__header,
    &__table-header {
      justify-content: space-between;
    }

    h3,
    p {
      margin: 0;
    }

    p {
      margin-top: 4px;
      color: var(--text-color);
    }

    button {
      cursor: pointer;

      flex-shrink: 0;

      min-height: 36px;
      padding: 6px 12px;

      color: var(--text-b-color);

      background-color: var(--primary);
      border: 0;
      border-radius: 8px;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &__table {
      display: flex;
      flex-direction: column;
      gap: 12px;

      padding: 12px;

      background-color: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    &__table-header {
      :deep(.n-select) {
        max-width: 420px;
      }

      button {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border);
      }
    }

    &__values {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label > span {
        width: 24px;
        color: var(--text-color);
        text-align: center;
      }

      :deep(.n-input) {
        flex-grow: 1;
      }
    }

    &__add-value {
      align-self: flex-start;
    }

    &__empty {
      margin: 0;
    }

    @media (max-width: 600px) {
      &__header,
      &__table-header {
        flex-direction: column;
        align-items: stretch;
      }

      &__values label {
        flex-wrap: wrap;
        align-items: flex-start;

        :deep(.n-input) {
          flex-basis: calc(100% - 36px);
        }

        button {
          margin-left: 36px;
        }
      }
    }
  }
</style>
