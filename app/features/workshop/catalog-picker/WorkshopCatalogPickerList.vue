<script setup lang="ts">
  import type { TabsItem } from '@nuxt/ui';

  import type { DetailType } from '~content/model';
  import type { FilterSelection, SectionConfig } from '~section/model';

  import type { CatalogPickerEntry } from '../model';

  import { ContentEntityDrawer } from '~content/entity-drawer';
  import {
    useLocalQueryStore,
    useSectionFilter,
    useSectionList,
    useSectionSearch,
  } from '~section/composables';
  import { SectionFilterDrawer } from '~section/filter-drawer';
  import { isPartCustomized } from '~section/model';
  import { SectionSourcesDrawer } from '~section/sources-drawer';

  import {
    CATALOG_PICKER_DATA_KEY,
    CATALOG_PICKER_ICON,
    CATALOG_PICKER_SCROLL_THRESHOLD_PX,
    CATALOG_PICKER_TEXT,
    CATALOG_PICKER_VIEW,
    catalogPickerLinkSchema,
    searchCatalogPickerEntries,
    toCatalogPickerEntries,
  } from '../model';

  /**
   * Список окна выбора, как на new.ttg.club: слева фильтр и источники
   * раздела, справа поиск, «Все» и вкладка отмеченного, строки с галочкой,
   * источником и описанием в дровере. Фильтр и поиск — те же, что у самого
   * раздела, только живут в памяти окна, а не в адресе страницы.
   */
  const { section, previewType } = defineProps<{
    section: SectionConfig;
    previewType: DetailType;
  }>();

  /** Черновик выбора окна. */
  const draft = defineModel<Array<CatalogPickerEntry>>({ required: true });

  const dataKey = `${CATALOG_PICKER_DATA_KEY}-${section.key}`;

  const store = useLocalQueryStore();
  const { input: searchInput, term } = useSectionSearch(store);

  // Ручка фильтра у окна не меняется, поэтому условный вызов безопасен
  const filter = section.filterUrl
    ? await useSectionFilter(dataKey, section.filterUrl, { store })
    : undefined;

  const filterPayload = computed(() => filter?.payload.value);

  const { items, status, isEnd, isLoadingMore, refresh, loadMore } =
    await useSectionList({
      key: dataKey,
      url: section.listUrl,
      schema: catalogPickerLinkSchema,
      order: section.order,
      size: section.pageSize,
      search: term,
      filter: filterPayload,
    });

  const entries = computed(() =>
    toCatalogPickerEntries(items.value, section.path),
  );

  const selection = computed<FilterSelection>(
    () => filter?.selection.value ?? {},
  );

  const otherGroups = computed(
    () =>
      filter?.definition.value?.other.filter((group) => !group.hidden) ?? [],
  );

  const sourceGroups = computed(
    () =>
      filter?.definition.value?.sources.filter((group) => !group.hidden) ?? [],
  );

  const hasOther = computed(() => otherGroups.value.length > 0);

  const hasSources = computed(() => sourceGroups.value.length > 0);

  const isOtherCustomized = computed(() => {
    const definition = filter?.definition.value;

    return (
      !!definition && isPartCustomized(definition, selection.value, 'other')
    );
  });

  const isSourcesCustomized = computed(() => {
    const definition = filter?.definition.value;

    return (
      !!definition && isPartCustomized(definition, selection.value, 'sources')
    );
  });

  const isResetShown = computed(() => !!filter?.isCustomized.value);

  const isFilterOpen = ref(false);
  const isSourcesOpen = ref(false);

  const selectedSlugs = computed(
    () => new Set(draft.value.map((entry) => entry.slug)),
  );

  type PickerView =
    (typeof CATALOG_PICKER_VIEW)[keyof typeof CATALOG_PICKER_VIEW];

  const activeView = ref<PickerView>(CATALOG_PICKER_VIEW.all);

  const isSelectedView = computed(
    () => activeView.value === CATALOG_PICKER_VIEW.selected,
  );

  /** Вкладки списка; число на второй — единственный счётчик набранного. */
  const viewTabItems = computed<Array<TabsItem>>(() => [
    { value: CATALOG_PICKER_VIEW.all, label: CATALOG_PICKER_TEXT.allTab },
    {
      value: CATALOG_PICKER_VIEW.selected,
      label: CATALOG_PICKER_TEXT.selectedTab,
      badge: {
        label: String(draft.value.length),
        color: 'neutral',
        variant: 'subtle',
      },
    },
  ]);

  /**
   * Отмеченное, отобранное тем же поиском: серверный поиск ищет по разделу,
   * а не по черновику.
   */
  const selectedEntries = computed(() =>
    searchCatalogPickerEntries(draft.value, searchInput.value),
  );

  const displayedEntries = computed(() =>
    isSelectedView.value ? selectedEntries.value : entries.value,
  );

  const isFirstLoading = computed(
    () =>
      !isSelectedView.value
      && status.value === 'pending'
      && !entries.value.length,
  );

  const isError = computed(
    () => !isSelectedView.value && status.value === 'error',
  );

  const isEmpty = computed(() => {
    if (isSelectedView.value) {
      return !selectedEntries.value.length;
    }

    return status.value === 'success' && !entries.value.length;
  });

  const emptyTitle = computed(() =>
    isSelectedView.value
      ? CATALOG_PICKER_TEXT.empty
      : CATALOG_PICKER_TEXT.emptyTitle,
  );

  const emptySubtitle = computed(() => {
    if (!isSelectedView.value) {
      return CATALOG_PICKER_TEXT.emptySubtitle;
    }

    return searchInput.value.trim()
      ? CATALOG_PICKER_TEXT.emptySelectedSearchSubtitle
      : CATALOG_PICKER_TEXT.emptySelectedSubtitle;
  });

  /**
   * Отмечена ли вся выдача отбора. Пока хвост выдачи не догружен, «всей» её
   * не назвать: галочка отметила бы только видимое.
   */
  const isAllSelected = computed(
    () =>
      isEnd.value
      && entries.value.length > 0
      && entries.value.every((entry) => selectedSlugs.value.has(entry.slug)),
  );

  /** Состояние галочки «Все»: отмечено целиком, частично или пусто. */
  const allCheckboxValue = computed<boolean | 'indeterminate'>(() => {
    if (isAllSelected.value) {
      return true;
    }

    return entries.value.some((entry) => selectedSlugs.value.has(entry.slug))
      ? 'indeterminate'
      : false;
  });

  const toggleAllAriaLabel = computed(() =>
    isAllSelected.value
      ? CATALOG_PICKER_TEXT.unselectAllAction
      : CATALOG_PICKER_TEXT.selectAllAction,
  );

  const isToggleAllDisabled = computed(
    () => !isEnd.value || status.value !== 'success' || !entries.value.length,
  );

  /** Запись, чьё описание открыто в дровере. */
  const previewEntry = ref<CatalogPickerEntry | null>(null);

  const previewPath = computed(() =>
    previewEntry.value ? `${section.path}/${previewEntry.value.slug}` : '',
  );

  const isPreviewOpen = computed({
    get: () => previewEntry.value !== null,
    set: (value: boolean) => {
      if (!value) {
        previewEntry.value = null;
      }
    },
  });

  const listElement = useTemplateRef<HTMLElement>('listElement');

  /**
   * Классы строки: отмеченная подсвечена.
   * @param entry - запись
   */
  function getRowClass(entry: CatalogPickerEntry): string | undefined {
    return selectedSlugs.value.has(entry.slug) ? 'bg-elevated/60' : undefined;
  }

  /**
   * Отмечает запись или снимает отметку.
   * @param entry - запись
   */
  function toggle(entry: CatalogPickerEntry): void {
    draft.value = selectedSlugs.value.has(entry.slug)
      ? draft.value.filter((item) => item.slug !== entry.slug)
      : [...draft.value, { ...entry }];
  }

  /** Отмечает всю выдачу отбора или снимает её, как галочка в шапке таблицы. */
  function toggleAll(): void {
    const slugs = new Set(entries.value.map((entry) => entry.slug));

    if (isAllSelected.value) {
      draft.value = draft.value.filter((entry) => !slugs.has(entry.slug));

      return;
    }

    draft.value = [
      ...draft.value,
      ...entries.value
        .filter((entry) => !selectedSlugs.value.has(entry.slug))
        .map((entry) => ({ ...entry })),
    ];
  }

  /**
   * Переключает вкладку; `UTabs` отдаёт значение строкой, поэтому чужое в
   * состояние не попадёт.
   * @param value - значение вкладки
   */
  function changeView(value: string | number): void {
    activeView.value =
      value === CATALOG_PICKER_VIEW.selected
        ? CATALOG_PICKER_VIEW.selected
        : CATALOG_PICKER_VIEW.all;

    // Прокрутка у вкладок общая: без сброса «Выбранные» открывались бы с
    // середины выдачи
    if (listElement.value) {
      listElement.value.scrollTop = 0;
    }
  }

  /**
   * Подгружает хвост выдачи, когда список прокручен почти до конца.
   * @param event - событие прокрутки списка
   */
  function handleScroll(event: Event): void {
    const target = event.target;

    if (isSelectedView.value || !(target instanceof HTMLElement)) {
      return;
    }

    const rest = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (rest <= CATALOG_PICKER_SCROLL_THRESHOLD_PX) {
      void loadMore();
    }
  }

  /**
   * Применяет выбор фильтра; правка отбирает раздел, а не черновик, поэтому
   * список возвращается на вкладку «Все».
   * @param next - новый выбор
   */
  function updateSelection(next: FilterSelection): void {
    filter?.setSelection(next);
    activeView.value = CATALOG_PICKER_VIEW.all;
  }

  function resetFilters(): void {
    filter?.reset();
    activeView.value = CATALOG_PICKER_VIEW.all;
  }

  function resetOther(): void {
    filter?.reset('other');
  }

  function resetSources(): void {
    filter?.reset('sources');
  }

  function openFilter(): void {
    isFilterOpen.value = true;
  }

  function openSources(): void {
    isSourcesOpen.value = true;
  }

  /**
   * Открывает описание записи дровером поверх окна: по названию не понять,
   * та ли это запись, а уйти за описанием значит потерять выбор.
   * @param entry - запись
   */
  function openPreview(entry: CatalogPickerEntry): void {
    previewEntry.value = entry;
  }

  function retry(): void {
    void refresh();
  }
</script>

<template>
  <div class="flex h-[65dvh] min-h-96 flex-col gap-3 sm:flex-row sm:gap-4">
    <!-- Фильтры: на узком экране кнопками над списком, на широком колонкой
      слева, как на new.ttg.club -->
    <div class="flex shrink-0 flex-col gap-2 sm:w-52">
      <UChip
        v-if="hasOther"
        :show="isOtherCustomized"
        inset
        class="w-full"
      >
        <UButton
          :icon="CATALOG_PICKER_ICON.filters"
          :label="CATALOG_PICKER_TEXT.filters"
          color="neutral"
          variant="subtle"
          block
          @click.left.exact.prevent="openFilter"
        />
      </UChip>

      <UChip
        v-if="hasSources"
        :show="isSourcesCustomized"
        inset
        class="w-full"
      >
        <UButton
          :icon="CATALOG_PICKER_ICON.sources"
          :label="CATALOG_PICKER_TEXT.sources"
          color="neutral"
          variant="subtle"
          block
          @click.left.exact.prevent="openSources"
        />
      </UChip>

      <UButton
        v-if="isResetShown"
        :icon="CATALOG_PICKER_ICON.resetFilters"
        :label="CATALOG_PICKER_TEXT.resetFilters"
        color="neutral"
        variant="ghost"
        size="xs"
        block
        @click.left.exact.prevent="resetFilters"
      />

      <p class="hidden text-xs text-dimmed sm:block">
        {{ CATALOG_PICKER_TEXT.filtersHint }}
      </p>
    </div>

    <div class="flex min-w-0 grow flex-col gap-3">
      <UInput
        v-model="searchInput"
        :icon="CATALOG_PICKER_ICON.search"
        :placeholder="CATALOG_PICKER_TEXT.searchPlaceholder"
        type="search"
        autocomplete="off"
        autofocus
      />

      <div class="flex items-center gap-2">
        <UButton
          v-if="!isSelectedView"
          :label="CATALOG_PICKER_TEXT.selectAll"
          :aria-label="toggleAllAriaLabel"
          :disabled="isToggleAllDisabled"
          color="neutral"
          variant="subtle"
          size="sm"
          class="shrink-0"
          @click.left.exact.prevent="toggleAll"
        >
          <template #leading>
            <UCheckbox
              :model-value="allCheckboxValue"
              tabindex="-1"
              class="pointer-events-none"
            />
          </template>
        </UButton>

        <UTabs
          :items="viewTabItems"
          :model-value="activeView"
          :content="false"
          :ui="{ list: 'w-full' }"
          size="sm"
          class="min-w-0 grow"
          @update:model-value="changeView"
        />
      </div>

      <div
        ref="listElement"
        class="min-h-0 grow overflow-y-auto rounded-md border border-default"
        @scroll="handleScroll"
      >
        <div
          v-if="isFirstLoading"
          class="grid place-items-center p-6"
        >
          <UIcon
            :name="CATALOG_PICKER_ICON.loading"
            class="size-6 animate-spin text-dimmed"
          />
        </div>

        <div
          v-else-if="isError"
          class="flex flex-col items-center gap-3 p-6 text-center"
        >
          <UIcon
            :name="CATALOG_PICKER_ICON.error"
            class="size-6 text-dimmed"
          />

          <p class="text-sm">{{ CATALOG_PICKER_TEXT.errorTitle }}</p>

          <UButton
            :label="CATALOG_PICKER_TEXT.retry"
            color="neutral"
            variant="subtle"
            @click.left.exact.prevent="retry"
          />
        </div>

        <div
          v-else-if="isEmpty"
          class="flex flex-col items-center gap-1 p-6 text-center"
        >
          <p class="text-sm text-highlighted">{{ emptyTitle }}</p>

          <p class="text-xs text-dimmed">{{ emptySubtitle }}</p>
        </div>

        <ul
          v-else
          class="divide-y divide-default"
        >
          <li
            v-for="entry in displayedEntries"
            :key="entry.slug"
            :class="getRowClass(entry)"
            class="relative flex items-center transition-colors hover:bg-elevated/50"
          >
            <!-- Отметка занимает всю строку (`after`), а кнопка описания
              лежит поверх неё: вложить одну кнопку в другую нельзя -->
            <button
              type="button"
              class="flex min-w-0 grow items-center gap-3 px-3 py-2 text-left after:absolute after:inset-0"
              @click.left.exact.prevent="toggle(entry)"
            >
              <UCheckbox
                :model-value="selectedSlugs.has(entry.slug)"
                tabindex="-1"
                class="pointer-events-none"
              />

              <span class="flex min-w-0 grow flex-col">
                <span class="truncate text-sm text-highlighted">
                  {{ entry.name }}
                </span>

                <span
                  v-if="entry.nameEng"
                  class="truncate text-xs text-dimmed"
                >
                  {{ entry.nameEng }}
                </span>
              </span>

              <UBadge
                v-if="entry.source"
                color="neutral"
                variant="subtle"
                class="shrink-0"
              >
                {{ entry.source.shortName }}
              </UBadge>
            </button>

            <UTooltip :text="CATALOG_PICKER_TEXT.preview">
              <UButton
                :icon="CATALOG_PICKER_ICON.preview"
                :aria-label="`${CATALOG_PICKER_TEXT.preview}: ${entry.name}`"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="relative z-10 mr-2 shrink-0"
                @click.left.exact.prevent="openPreview(entry)"
              />
            </UTooltip>
          </li>
        </ul>

        <div
          v-if="isLoadingMore && !isSelectedView"
          class="grid place-items-center py-3"
        >
          <UIcon
            :name="CATALOG_PICKER_ICON.loading"
            class="size-5 animate-spin text-dimmed"
          />
        </div>
      </div>
    </div>

    <SectionFilterDrawer
      v-if="hasOther"
      v-model:open="isFilterOpen"
      :groups="otherGroups"
      :selection="selection"
      :is-customized="isOtherCustomized"
      @update:selection="updateSelection"
      @reset="resetOther"
    />

    <SectionSourcesDrawer
      v-if="hasSources"
      v-model:open="isSourcesOpen"
      :groups="sourceGroups"
      :selection="selection"
      :is-customized="isSourcesCustomized"
      @update:selection="updateSelection"
      @reset="resetSources"
    />

    <ContentEntityDrawer
      v-if="previewEntry"
      :key="previewPath"
      v-model:open="isPreviewOpen"
      :type="previewType"
      :path="previewPath"
      :title="previewEntry.name"
    />
  </div>
</template>
