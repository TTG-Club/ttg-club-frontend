<script setup lang="ts">
  import type { RollOutcome } from '~dice-roller/model';

  import type { RollTableData } from '../model';

  import { ROLL_ERROR_TEXT } from '~dice-roller/model';
  import { DiceRoller } from '~dice-roller/roller';

  import {
    findRollTableRow,
    ROLL_TABLE_HIGHLIGHT_MS,
    ROLL_TABLE_HIT_ICON,
  } from '../model';
  import { ContentRender } from '../render';

  /**
   * Таблица бросков: бросок формулы из шапки подсвечивает строку,
   * в диапазон которой попал результат.
   */
  const { table } = defineProps<{
    table: RollTableData;
  }>();

  const toast = useToast();
  const highlighted = refAutoReset(-1, ROLL_TABLE_HIGHLIGHT_MS);
  const rows = useTemplateRef('rows');

  function getRowClass(rowIndex: number) {
    return rowIndex === highlighted.value ? 'bg-row-highlighted!' : undefined;
  }

  function getCellClass(cellIndex: number) {
    return cellIndex ? undefined : 'whitespace-nowrap';
  }

  function showResult({ value }: RollOutcome) {
    const index = findRollTableRow(table.tbody, value);

    if (index === -1) {
      toast.add({ title: ROLL_ERROR_TEXT, color: 'error' });

      return;
    }

    highlighted.value = index;

    rows.value?.[index]?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }
</script>

<template>
  <table class="w-full table-auto">
    <thead>
      <tr>
        <th class="px-3 py-2 whitespace-nowrap">
          <DiceRoller
            :formula="table.formula"
            @roll="showResult"
          />
        </th>

        <th
          v-for="(cell, cellIndex) in table.thead"
          :key="cellIndex"
          class="px-3 py-2"
        >
          <ContentRender
            :html="cell"
            tag="span"
          />
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="(row, rowIndex) in table.tbody"
        ref="rows"
        :key="rowIndex"
        :class="getRowClass(rowIndex)"
        class="transition-colors"
      >
        <component
          :is="cellIndex ? 'td' : 'th'"
          v-for="(cell, cellIndex) in row"
          :key="cellIndex"
          class="px-3 py-2"
          :class="getCellClass(cellIndex)"
        >
          <UIcon
            v-if="!cellIndex && rowIndex === highlighted"
            :name="ROLL_TABLE_HIT_ICON"
            class="mx-auto block size-[18px] text-dice"
          />

          <ContentRender
            v-else
            :html="cell"
            tag="span"
          />
        </component>
      </tr>
    </tbody>
  </table>
</template>
