<script setup lang="ts" generic="T">
  import type { z } from 'zod';

  import type {
    SectionConfig,
    SectionGroupingOption,
    SectionListView,
  } from '../model';

  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

  import {
    provideSectionOpener,
    useSectionDetail,
    useSectionFilter,
    useSectionList,
    useSectionPaths,
    useSectionSearch,
  } from '../composables';
  import { SectionControls } from '../controls';
  import { SectionLayout } from '../layout';
  import { SectionList } from '../list';
  import { groupItems, SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Страница раздела целиком: поиск, фильтр, список с подгрузкой и открытая
   * запись. В широком режиме запись стоит рядом со списком (`?detail=`), в
   * обычном открывается дровером или, если раздел так велит, своей
   * страницей, на телефоне — своей страницей. Раздел
   * задаёт только ручки, проверку записей, вид строки списка и запись.
   */
  const {
    section,
    schema,
    getKey,
    getGroup = undefined,
    getGroupOrder = undefined,
    getPath = undefined,
    sortItems = undefined,
    view = undefined,
    groupingOptions = undefined,
  } = defineProps<{
    /** Заголовок, ручки, сортировка и размер страницы раздела. */
    section: SectionConfig;
    schema: z.ZodType<T>;
    getKey: (item: T) => string;
    /** Подпись группы записи; с несколькими запись есть в каждой группе. */
    getGroup?: (item: T) => string | Array<string>;
    /** Порядок группы записи; без него группы идут по первой записи. */
    getGroupOrder?: (item: T, group: string) => number;
    /** Адрес записи на сайте; без него строки списка никуда не ведут. */
    getPath?: (item: T) => string;
    /**
     * Порядок записей на странице, если ручка отдаёт их не так; при поиске
     * получает и строку поиска.
     */
    sortItems?: (items: Array<T>, search: string) => Array<T>;
    /** Вид списка: плитки-строки, карточки рас или обложки классов. */
    view?: SectionListView;
    /** Варианты группировки списка для меню «Ещё». */
    groupingOptions?: Array<SectionGroupingOption>;
  }>();

  const slots = defineSlots<{
    /** Строка списка; `to` — адрес записи. */
    item: (props: { item: T; to?: string }) => unknown;
    /**
     * Запись поверх списка по адресу. Без слота записи открываются только
     * своей страницей.
     */
    entry?: (props: { path: string }) => unknown;
  }>();

  /** Выбранная группировка из `groupingOptions`. */
  const grouping = defineModel<string>('grouping');

  const { input, term } = useSectionSearch();

  // Ручка фильтра у раздела не меняется, поэтому условный вызов безопасен
  const filter = section.filterUrl
    ? await useSectionFilter(section.key, section.filterUrl)
    : undefined;

  const filterPayload = computed(() => filter?.payload.value);

  const { items, status, isEnd, isLoadingMore, refresh, loadMore } =
    await useSectionList({
      key: section.key,
      url: section.listUrl,
      schema,
      order: section.order,
      size: section.pageSize,
      search: term,
      filter: filterPayload,
    });

  const sortedItems = computed(() =>
    sortItems ? sortItems(items.value, term.value) : items.value,
  );

  // Слот записи у раздела не меняется, поэтому условный вызов безопасен
  const detail = slots.entry
    ? await useSectionDetail(section.path, section.isDrawerDisabled)
    : undefined;

  if (detail) {
    provideSectionOpener({
      activePath: detail.activePath,
      open: detail.open,
      close: detail.close,
    });
  }

  const isSplit = computed(() => !!detail?.isSplitActive.value);

  const detailPath = computed(() => detail?.detailPath.value);

  const drawerPath = computed(() => detail?.drawerPath.value);

  const isDrawerOpen = computed({
    get: () => !!detail?.isDrawerOpen.value,
    set: (value: boolean) => {
      if (detail) {
        detail.isDrawerOpen.value = value;
      }
    },
  });

  // Записи в порядке экрана: после группировки он может отличаться от
  // ответа ручки, а запись из нескольких групп считается по первой
  const visiblePaths = computed(() => {
    if (!getPath) {
      return [];
    }

    const visibleItems = getGroup
      ? groupItems(sortedItems.value, getGroup, getGroupOrder).flatMap(
          (group) => group.items,
        )
      : sortedItems.value;

    return [...new Set(visibleItems.map(getPath))];
  });

  const firstPath = computed(() => visiblePaths.value[0]);

  // Страница записи на телефоне листает соседние записи этого списка;
  // серверу порядок не нужен, и в ответ страницы он не попадает
  const sectionPaths = useSectionPaths(section.key);

  if (import.meta.client) {
    watchImmediate(visiblePaths, (paths) => {
      sectionPaths.value = paths;
    });
  }

  // Пустую панель заполняет первая запись списка — уже в браузере, чтобы
  // разметка сервера совпала с первой отрисовкой, и при включении широкого
  // режима
  const isMounted = useMounted();

  watch([isMounted, firstPath, isSplit], ([mounted, path, split]) => {
    if (mounted && split) {
      detail?.selectFirst(path);
    }
  });

  /**
   * Адрес записи для строки списка.
   * @param item - запись списка
   */
  function getLink(item: T): string | undefined {
    return getPath?.(item);
  }

  const isDrawerInset = useMediaQuery(LAYOUT_DRAWER_QUERY);

  function retry() {
    return refresh();
  }
</script>

<template>
  <SectionLayout
    :title="section.title"
    :is-split="isSplit"
    :is-wide-detail="section.wideDetail"
  >
    <template #controls>
      <SectionControls
        v-model:search="input"
        v-model:grouping="grouping"
        :grouping-options="groupingOptions"
        :definition="filter?.definition.value"
        :selection="filter?.selection.value ?? {}"
        :is-customized="filter?.isCustomized.value"
        @update:selection="filter?.setSelection($event)"
        @reset="filter?.reset($event)"
      />
    </template>

    <SectionList
      :items="sortedItems"
      :get-key="getKey"
      :get-group="getGroup"
      :get-group-order="getGroupOrder"
      :status="status"
      :is-end="isEnd"
      :is-loading-more="isLoadingMore"
      :view="view"
      @load-more="loadMore"
      @retry="retry"
    >
      <template #default="{ item }">
        <slot
          name="item"
          :item="item"
          :to="getLink(item)"
        />
      </template>
    </SectionList>

    <UDrawer
      v-if="detail && !isSplit"
      v-model:open="isDrawerOpen"
      :title="section.title"
      :inset="isDrawerInset"
      :handle="false"
      direction="right"
      :ui="{
        content: 'w-full max-w-2xl',
        // Свои отступы только у тела: отступ контейнера складывался
        // с отступом тела, а у записи свой pt-2, и сверху оставалась пустота
        container: 'gap-0 p-0',
        header: 'sr-only',
        body: 'px-4 pt-2 pb-4 sm:px-6 sm:pb-6',
      }"
    >
      <template #body>
        <div
          v-if="drawerPath"
          :key="drawerPath"
        >
          <slot
            name="entry"
            :path="drawerPath"
          />
        </div>
      </template>
    </UDrawer>

    <template #detail>
      <div
        v-if="detailPath"
        :key="detailPath"
      >
        <slot
          name="entry"
          :path="detailPath"
        />
      </div>

      <UEmpty
        v-else
        :icon="SECTION_ICON.detailEmpty"
        :title="SECTION_TEXT.detailEmpty"
        :description="SECTION_TEXT.detailEmptyHint"
        variant="naked"
        class="h-full"
      />
    </template>
  </SectionLayout>
</template>
