<script setup lang="ts" generic="T">
  import type { z } from 'zod';

  import type { SectionConfig } from '../model';

  import { LAYOUT_DRAWER_QUERY } from '~/shared/consts';

  import {
    provideSectionOpener,
    useSectionDetail,
    useSectionFilter,
    useSectionList,
    useSectionSearch,
  } from '../composables';
  import { SectionControls } from '../controls';
  import { SectionLayout } from '../layout';
  import { SectionList } from '../list';
  import { groupItems, SECTION_ICON, SECTION_TEXT } from '../model';

  /**
   * Страница раздела целиком: поиск, фильтр, список с подгрузкой и открытая
   * запись. В широком режиме запись стоит рядом со списком (`?detail=`), в
   * обычном открывается дровером, на телефоне — своей страницей. Раздел
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
    isGrid = false,
  } = defineProps<{
    /** Заголовок, ручки, сортировка и размер страницы раздела. */
    section: SectionConfig;
    schema: z.ZodType<T>;
    getKey: (item: T) => string;
    getGroup?: (item: T) => string;
    /** Порядок группы записи; без него группы идут по первой записи. */
    getGroupOrder?: (item: T) => number;
    /** Адрес записи на сайте; без него строки списка никуда не ведут. */
    getPath?: (item: T) => string;
    /** Порядок записей на странице, если ручка отдаёт их не так. */
    sortItems?: (items: Array<T>) => Array<T>;
    /** Записи карточками в сетку, как расы и классы. */
    isGrid?: boolean;
  }>();

  const slots = defineSlots<{
    /** Строка списка; `to` — адрес записи. */
    item: (props: { item: T; to?: string }) => unknown;
    /**
     * Запись поверх списка по адресу. Без слота записи открываются только
     * своей страницей, как классы с вкладками.
     */
    entry?: (props: { path: string }) => unknown;
  }>();

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
    sortItems ? sortItems(items.value) : items.value,
  );

  // Слот записи у раздела не меняется, поэтому условный вызов безопасен
  const detail = slots.entry ? await useSectionDetail(section.path) : undefined;

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

  // Первая запись на экране: после группировки она может быть не первой в
  // ответе ручки
  const firstPath = computed(() => {
    const [firstGroup] = getGroup
      ? groupItems(sortedItems.value, getGroup, getGroupOrder)
      : [];

    const [first] = firstGroup?.items ?? sortedItems.value;

    return first && getPath ? getPath(first) : undefined;
  });

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
  >
    <template #controls>
      <SectionControls
        v-model:search="input"
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
      :is-grid="isGrid"
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
        header: 'sr-only',
        body: 'p-4 sm:p-6',
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
