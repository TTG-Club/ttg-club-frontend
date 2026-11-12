<script setup lang="ts">
  import type { SplitterItem } from '@nuxt/ui';

  import type { SectionSplitBounds } from '~/shared/consts';

  import { clamp } from 'es-toolkit';

  import {
    SECTION_CENTERED_LIST_SIZE,
    SECTION_CENTERED_SPLIT_SUFFIX,
    SECTION_FILTERS_SIZE,
    SECTION_FILTERS_SPLIT_ID,
    SECTION_LIST_SIZE,
    SECTION_SPLIT_HANDLE_CLASS,
    SECTION_SPLIT_HANDLE_SUBTLE_CLASS,
    SECTION_SPLIT_ID,
    SECTION_SPLIT_SIZE_EPSILON,
    SECTION_WIDE_DETAIL_LIST_SIZE,
    SECTION_WIDE_DETAIL_SPLIT_ID,
  } from '~/shared/consts';

  import { getQueryString, SECTION_DETAIL_QUERY_KEY } from '../model';
  import SectionTopBar from './SectionTopBar.vue';

  /**
   * Раскладка раздела. В обычном режиме — заголовок, поиск и фильтр шапкой
   * над списком, как в старом SPA, или колонкой слева (инструменты,
   * мастерская). В широком режиме колонки стоят, как выбрано в настройках
   * отображения, как на new.ttg.club: фильтры колонкой слева, справа или
   * строкой над списком, запись справа или слева от списка, а узкая
   * раскладка ставит список и запись колонкой по центру. Границы между
   * колонками перетаскиваются.
   */
  const {
    title,
    isSplit = false,
    isTopBar = false,
    isWideDetail = false,
    isFullWidth = false,
  } = defineProps<{
    title: string;
    /** Широкий режим: список и запись рядом. */
    isSplit?: boolean;
    /** Заголовок и управление шапкой над списком, а не колонкой слева. */
    isTopBar?: boolean;
    /** Запись по умолчанию шире списка, как у классов. */
    isWideDetail?: boolean;
    /**
     * Раздел на всю ширину: колонка слева прижата к меню, а не центрируется
     * вместе с содержимым. Нужно инструментам, где справа растёт результат.
     */
    isFullWidth?: boolean;
  }>();

  defineSlots<{
    /** Поиск и фильтр; `isColumn` — они стоят колонкой фильтров. */
    controls?: (props: { isColumn: boolean }) => unknown;
    default: () => unknown;
    detail?: () => unknown;
  }>();

  const route = useRoute();

  const { isCollapsedInSplit } = useSectionFiltersCollapsed();
  const { isCenteredInSplit } = useSectionCentered();
  const { filtersSide, detailSide } = useSectionColumnSides();

  const columnsClass = computed(() =>
    isFullWidth ? 'w-full' : 'mx-auto w-full lg:max-w-330',
  );

  const isCentered = computed(() => isSplit && isCenteredInSplit.value);

  /** Фильтры строкой над списком: так выбрано или узкая раскладка. */
  const isTopBarInSplit = computed(() => isCollapsedInSplit.value);

  const baseSplitId = computed(() =>
    isWideDetail ? SECTION_WIDE_DETAIL_SPLIT_ID : SECTION_SPLIT_ID,
  );

  // Узкая раскладка запоминает ширину списка отдельно: у неё своя колонка
  const activeSplitId = computed(() =>
    isCentered.value
      ? `${baseSplitId.value}-${SECTION_CENTERED_SPLIT_SUFFIX}`
      : baseSplitId.value,
  );

  const { size: storedListSize, saveSize: saveListSize } = useSectionSplitSize(
    () => activeSplitId.value,
  );

  const { size: storedFiltersSize, saveSize: saveFiltersSize } =
    useSectionSplitSize(SECTION_FILTERS_SPLIT_ID);

  const isDetailOpen = computed(
    () => !!getQueryString(route.query[SECTION_DETAIL_QUERY_KEY]),
  );

  /**
   * Видна ли запись. В узкой раскладке без открытой записи список занимает
   * всю колонку; в остальных раскладках панель записи есть всегда.
   */
  const isDetailVisible = computed(
    () => !isCentered.value || isDetailOpen.value,
  );

  // Обычному списку в узкой колонке — пропорции старого SPA; широкая
  // запись класса оставляет свои
  const listBounds = computed<SectionSplitBounds>(() => {
    if (isWideDetail) {
      return SECTION_WIDE_DETAIL_LIST_SIZE;
    }

    return isCentered.value ? SECTION_CENTERED_LIST_SIZE : SECTION_LIST_SIZE;
  });

  // Запомненная ширина могла остаться от других границ — держим её в них
  const listSize = computed(() =>
    clamp(
      storedListSize.value ?? listBounds.value.default,
      listBounds.value.min,
      listBounds.value.max,
    ),
  );

  const filtersSize = computed(() =>
    clamp(
      storedFiltersSize.value ?? SECTION_FILTERS_SIZE.default,
      SECTION_FILTERS_SIZE.min,
      SECTION_FILTERS_SIZE.max,
    ),
  );

  // Запись может стоять и слева от списка: порядок панелей меняется местами
  const splitItems = computed<Array<SplitterItem>>(() => {
    const listClass = 'h-full min-w-0 flex-col';
    const detailClass = 'h-full min-w-0 flex-col';

    if (!isDetailVisible.value) {
      return [{ slot: 'list', defaultSize: 100, class: listClass }];
    }

    const list: SplitterItem = {
      slot: 'list',
      defaultSize: listSize.value,
      minSize: listBounds.value.min,
      maxSize: listBounds.value.max,
      class: listClass,
    };

    const detail: SplitterItem = {
      slot: 'detail',
      defaultSize: 100 - listSize.value,
      class: detailClass,
    };

    return detailSide.value === 'left' ? [detail, list] : [list, detail];
  });

  const outerSplitItems = computed<Array<SplitterItem>>(() => {
    const main: SplitterItem = {
      slot: 'main',
      defaultSize: isTopBarInSplit.value ? 100 : 100 - filtersSize.value,
      class: 'h-full min-w-0 flex-col',
    };

    if (isTopBarInSplit.value) {
      return [main];
    }

    const filters: SplitterItem = {
      slot: 'filters',
      defaultSize: filtersSize.value,
      minSize: SECTION_FILTERS_SIZE.min,
      maxSize: SECTION_FILTERS_SIZE.max,
      class: 'h-full min-w-0 flex-col',
    };

    return filtersSide.value === 'right' ? [main, filters] : [filters, main];
  });

  // Ключи разделителей — набор и порядок панелей: при перестановке
  // разделитель собирается заново с нужными ширинами
  const outerSplitKey = computed(() =>
    isTopBarInSplit.value ? 'top' : filtersSide.value,
  );

  const innerSplitKey = computed(
    () => `${activeSplitId.value}-${detailSide.value}-${isDetailVisible.value}`,
  );

  // В узкой раскладке у записи своя рамка — линия видна только при наведении
  const innerSplitHandleClass = computed(() =>
    isCentered.value
      ? SECTION_SPLIT_HANDLE_SUBTLE_CLASS
      : SECTION_SPLIT_HANDLE_CLASS,
  );

  // В узкой раскладке запись — карточкой с отступом от разделителя
  const centeredDetailClass = computed(() =>
    detailSide.value === 'left' ? 'py-3 pr-3' : 'py-3 pl-3',
  );

  // Под шапкой отступ меньше: шапка сама отделена от списка линией
  const listScrollClass = computed(() =>
    isTopBarInSplit.value ? 'pt-4' : 'pt-6',
  );

  const listIndex = computed(() => (detailSide.value === 'left' ? 1 : 0));

  const filtersIndex = computed(() => (filtersSide.value === 'right' ? 1 : 0));

  /**
   * Сдвинул ли посетитель разделитель. Разделитель сообщает ширины и при
   * сборке — такие не пишем: все ширины живут в одной cookie, и
   * одновременная запись затёрла бы одну из них.
   *
   * @param size - Новая ширина, в процентах
   * @param current - Действующая ширина
   * @returns `true`, если ширина и правда другая
   */
  function isSizeChanged(
    size: number | undefined,
    current: number,
  ): size is number {
    return (
      size !== undefined
      && Math.abs(size - current) >= SECTION_SPLIT_SIZE_EPSILON
    );
  }

  /**
   * Запоминает ширину колонки фильтров после перетаскивания разделителя.
   *
   * @param sizes - Ширины колонок, в процентах
   */
  function handleOuterSplitLayout(sizes: Array<number>): void {
    const size = sizes[filtersIndex.value];

    if (!isTopBarInSplit.value && isSizeChanged(size, filtersSize.value)) {
      saveFiltersSize(size);
    }
  }

  /**
   * Запоминает ширину списка после перетаскивания разделителя.
   *
   * @param sizes - Ширины колонок, в процентах
   */
  function handleSplitLayout(sizes: Array<number>): void {
    const size = sizes[listIndex.value];

    if (isDetailVisible.value && isSizeChanged(size, listSize.value)) {
      saveListSize(size);
    }
  }
</script>

<template>
  <!-- Широкий режим. Высоту задают обёртки: разделитель ставит себе -->
  <!-- `height: 100%` в style, и класс высоты на нём не действует. -->
  <div
    v-if="isSplit"
    class="h-dvh w-full"
    :class="{ 'mx-auto max-w-330 px-2': isCentered }"
  >
    <!-- Колонка фильтров — слева или справа; над списком — одна панель -->
    <USplitter
      :id="`section-split-${SECTION_FILTERS_SPLIT_ID}`"
      :key="outerSplitKey"
      :items="outerSplitItems"
      :ui="{ handle: SECTION_SPLIT_HANDLE_CLASS }"
      @layout="handleOuterSplitLayout"
    >
      <template #filters>
        <aside
          class="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto p-4 pt-6"
        >
          <h1 class="text-2xl text-highlighted">
            {{ title }}
          </h1>

          <slot
            name="controls"
            :is-column="true"
          />
        </aside>
      </template>

      <!-- Список и запись. Ключ — раскладка, порядок и набор панелей -->
      <template #main>
        <USplitter
          :id="`section-split-${activeSplitId}`"
          :key="innerSplitKey"
          :items="splitItems"
          :ui="{ handle: innerSplitHandleClass }"
          @layout="handleSplitLayout"
        >
          <!-- Шапка над списком не прокручивается: полоса прокрутки — у списка -->
          <template #list>
            <div class="flex h-full flex-col">
              <SectionTopBar
                v-if="isTopBarInSplit"
                class="shrink-0"
                :title="title"
              >
                <slot
                  name="controls"
                  :is-column="false"
                />
              </SectionTopBar>

              <div
                class="min-h-0 flex-auto overflow-y-auto px-4 pb-8"
                :class="listScrollClass"
              >
                <slot />
              </div>
            </div>
          </template>

          <template #detail>
            <div
              v-if="isCentered"
              class="size-full"
              :class="centeredDetailClass"
            >
              <div
                class="size-full overflow-y-auto rounded-xl border border-default bg-elevated/40 px-6 pt-4 pb-8"
              >
                <slot name="detail" />
              </div>
            </div>

            <div
              v-else
              class="h-full overflow-y-auto px-6 pt-4 pb-8"
            >
              <slot name="detail" />
            </div>
          </template>
        </USplitter>
      </template>
    </USplitter>
  </div>

  <div
    v-else-if="isTopBar"
    class="mx-auto flex w-full flex-col lg:max-w-330"
  >
    <SectionTopBar :title="title">
      <slot
        name="controls"
        :is-column="false"
      />
    </SectionTopBar>

    <div class="flex min-w-0 flex-auto flex-col px-4 pt-4 pb-8">
      <slot />
    </div>
  </div>

  <div
    v-else
    class="flex flex-col lg:flex-row"
    :class="columnsClass"
  >
    <aside
      class="sticky top-0 z-10 scrollbar-none shrink-0 border-default bg-default lg:h-dvh lg:overflow-y-auto lg:border-r"
    >
      <div class="flex w-full flex-col gap-4 p-4 md:pt-6 lg:w-75">
        <h1 class="text-2xl text-highlighted">
          {{ title }}
        </h1>

        <slot
          name="controls"
          :is-column="false"
        />
      </div>
    </aside>

    <div class="flex min-w-0 flex-auto flex-col px-4 pb-8 lg:pt-6">
      <slot />
    </div>
  </div>
</template>
