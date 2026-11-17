<script setup lang="ts">
  import type { DmScreenGrid } from '../model';

  import { useDmScreen } from '../composables';
  import {
    DM_SCREEN_ARRANGE_GRID_CLASS,
    DM_SCREEN_ARRANGE_GRID_SIZE,
    DM_SCREEN_ICON,
    DM_SCREEN_SNAP_ZONE_CLASS,
    DM_SCREEN_TEXT,
    formatDmScreenGrid,
    getDmScreenGridCells,
    isDmScreenGridCellInside,
  } from '../model';

  /**
   * Кнопка «Выровнять по сетке»: под ней открывается поле клеток, как при
   * вставке таблицы. Мастер ведёт указателем от левого верхнего угла —
   * подсвеченный прямоугольник показывает, сколько будет колонок и рядов, —
   * и кликом раскладывает окна такой сеткой на видимой части поля. Сетку
   * можно и не выбирать: «Подобрать автоматически» раскладывает окна так,
   * как делала кнопка раньше.
   */
  const { arrange } = useDmScreen();

  const isOpen = ref(false);

  /** Сетка под указателем; пока он не над клетками — её нет. */
  const hoveredGrid = shallowRef<DmScreenGrid>();

  // Закрытое окно выбора не помнит прошлую подсветку
  watch(isOpen, () => {
    hoveredGrid.value = undefined;
  });

  const cells = getDmScreenGridCells(DM_SCREEN_ARRANGE_GRID_SIZE);

  const cellViews = computed(() =>
    cells.map((cell) => ({
      cell,
      key: formatDmScreenGrid(cell),
      label: `${DM_SCREEN_TEXT.arrangeCell} ${formatDmScreenGrid(cell)}`,
      class:
        hoveredGrid.value && isDmScreenGridCellInside(cell, hoveredGrid.value)
          ? DM_SCREEN_SNAP_ZONE_CLASS.active
          : DM_SCREEN_SNAP_ZONE_CLASS.idle,
    })),
  );

  const caption = computed(() =>
    hoveredGrid.value
      ? formatDmScreenGrid(hoveredGrid.value)
      : DM_SCREEN_TEXT.arrangeHint,
  );

  /**
   * Указатель или фокус встал на клетку: сетка — от угла до неё.
   * @param cell - клетка: её колонка и ряд
   */
  function hoverCell(cell: DmScreenGrid): void {
    hoveredGrid.value = cell;
  }

  /** Указатель ушёл с клеток: подсветка снимается. */
  function leaveCells(): void {
    hoveredGrid.value = undefined;
  }

  /**
   * Раскладывает окна выбранной сеткой и закрывает окно выбора.
   * @param cell - клетка: сколько колонок и рядов в сетке
   */
  function pickCell(cell: DmScreenGrid): void {
    arrange(cell);

    isOpen.value = false;
  }

  /** Раскладывает окна сеткой, которую ширма подбирает сама. */
  function arrangeAutomatically(): void {
    arrange();

    isOpen.value = false;
  }
</script>

<template>
  <UPopover v-model:open="isOpen">
    <UTooltip :text="DM_SCREEN_TEXT.arrange">
      <UButton
        :icon="DM_SCREEN_ICON.arrange"
        :aria-label="DM_SCREEN_TEXT.arrange"
        color="neutral"
        variant="outline"
      />
    </UTooltip>

    <template #content>
      <div class="flex flex-col gap-2 p-3">
        <p class="flex items-baseline justify-between gap-3 text-sm">
          <span class="text-muted">
            {{ DM_SCREEN_TEXT.arrangeTitle }}
          </span>

          <span class="text-highlighted tabular-nums">
            {{ caption }}
          </span>
        </p>

        <div
          class="grid gap-1"
          :class="DM_SCREEN_ARRANGE_GRID_CLASS"
          @pointerleave="leaveCells"
        >
          <button
            v-for="view in cellViews"
            :key="view.key"
            type="button"
            :aria-label="view.label"
            class="size-5 rounded-sm border transition-colors"
            :class="view.class"
            @pointerenter="hoverCell(view.cell)"
            @focus="hoverCell(view.cell)"
            @click.left.exact.prevent="pickCell(view.cell)"
          />
        </div>

        <UButton
          :label="DM_SCREEN_TEXT.arrangeAuto"
          color="neutral"
          variant="soft"
          size="sm"
          block
          @click.left.exact.prevent="arrangeAutomatically"
        />
      </div>
    </template>
  </UPopover>
</template>
