<script setup lang="ts">
  import type { ClassTraits } from '../model';

  import { CLASS_TEXT, findClassFeature, REFERENCE_SEPARATOR } from '../model';
  import ClassTraitAnchor from './ClassTraitAnchor.vue';

  /**
   * Таблица уровней класса: бонус мастерства, умения со ссылками,
   * колонки класса и архетипа и ячейки заклинаний.
   */
  const { traits } = defineProps<{
    traits: ClassTraits;
  }>();

  const emit = defineEmits<{
    select: [anchor: string];
  }>();

  // Сколько колонок ячеек: у полузаклинателей их меньше девяти
  const slotHeaders = computed(() => {
    const count = Math.max(
      0,
      ...(traits.levels ?? []).map((level) => level.spellSlots.length),
    );

    return Array.from({ length: count }, (_, index) => index + 1);
  });

  const hasSlots = computed(() => slotHeaders.value.length > 0);

  // С ячейками заголовок в две строки: номера кругов идут второй
  const headerRowspan = computed(() => (hasSlots.value ? 2 : 1));

  const featureColumns = computed(() => [
    ...(traits.classFeatureLevels ?? []),
    ...(traits.archetypeFeatureLevels ?? []),
  ]);

  const rows = computed(() =>
    (traits.levels ?? []).map((level) => ({
      level: level.level,
      proficiencyBonus: `+${level.proficiencyBonus}`,
      traits: level.traits.map((traitLink, index) => ({
        traitLink,
        feature: findClassFeature(traits, traitLink.anchor),
        separator:
          index < level.traits.length - 1 ? REFERENCE_SEPARATOR : undefined,
      })),
      values: [
        ...level.classFeatureValues,
        ...level.archetypeFeatureValues,
        ...level.spellSlots,
      ],
    })),
  );

  interface HoveredCell {
    row: number;
    column: number;
  }

  /** Первые колонки — уровень, бонус мастерства и умения, дальше значения. */
  const VALUES_COLUMN_OFFSET = 3;

  const hoveredCell = ref<HoveredCell>();

  /**
   * Подсветка крестом, как на new.ttg.club: строка и колонка под курсором,
   * а сама ячейка ярче.
   * @param row - номер строки
   * @param column - номер колонки
   */
  function getCellClass(row: number, column: number): string | undefined {
    if (!hoveredCell.value) {
      return undefined;
    }

    const isRow = hoveredCell.value.row === row;
    const isColumn = hoveredCell.value.column === column;

    if (isRow && isColumn) {
      return 'bg-row-highlighted';
    }

    return isRow || isColumn ? 'bg-row-highlighted/50' : undefined;
  }

  function hoverCell(row: number, column: number): void {
    hoveredCell.value = { row, column };
  }

  function leaveTable(): void {
    hoveredCell.value = undefined;
  }

  /**
   * Передаёт выбранный якорь наверх: прокручивает вкладка.
   * @param anchor - якорь умения
   */
  function select(anchor: string) {
    emit('select', anchor);
  }
</script>

<template>
  <div class="table-responsive class">
    <table @mouseleave="leaveTable">
      <thead>
        <tr class="text-center">
          <th
            :rowspan="headerRowspan"
            class="w-6"
          >
            {{ CLASS_TEXT.level }}
          </th>

          <th
            :rowspan="headerRowspan"
            class="w-6"
          >
            {{ CLASS_TEXT.proficiencyBonus }}
          </th>

          <th
            :rowspan="headerRowspan"
            class="align_left"
          >
            {{ CLASS_TEXT.features }}
          </th>

          <th
            v-for="column in featureColumns"
            :key="column.name"
            :rowspan="headerRowspan"
            class="w-[5%]"
          >
            {{ column.name }}
          </th>

          <th
            v-if="hasSlots"
            :colspan="slotHeaders.length"
          >
            {{ CLASS_TEXT.spellSlots }}
          </th>
        </tr>

        <tr
          v-if="hasSlots"
          class="text-center"
        >
          <th
            v-for="slot in slotHeaders"
            :key="slot"
          >
            {{ slot }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="row.level"
          class="text-center"
        >
          <td
            :class="getCellClass(rowIndex, 0)"
            @mouseenter="hoverCell(rowIndex, 0)"
          >
            {{ row.level }}
          </td>

          <td
            :class="getCellClass(rowIndex, 1)"
            @mouseenter="hoverCell(rowIndex, 1)"
          >
            {{ row.proficiencyBonus }}
          </td>

          <td
            :class="['align_left', getCellClass(rowIndex, 2)]"
            @mouseenter="hoverCell(rowIndex, 2)"
          >
            <span
              v-for="trait in row.traits"
              :key="trait.traitLink.anchor"
              class="mr-1"
              ><ClassTraitAnchor
                :trait-link="trait.traitLink"
                :feature="trait.feature"
                @select="select"
              />{{ trait.separator }}</span
            >
          </td>

          <td
            v-for="(value, index) in row.values"
            :key="index"
            :class="getCellClass(rowIndex, index + VALUES_COLUMN_OFFSET)"
            @mouseenter="hoverCell(rowIndex, index + VALUES_COLUMN_OFFSET)"
          >
            {{ value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
