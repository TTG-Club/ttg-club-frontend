<script setup lang="ts">
  import type { ThemeMode } from '#shared/consts';
  import type { CharacterListView, ListView } from '~/shared/consts';

  import {
    LAYOUT_DRAWER_QUERY,
    LAYOUT_SPLIT_QUERY,
    LIST_VIEW_OPTIONS,
  } from '~/shared/consts';

  import { DisplaySettingsChoice } from './choice';
  import {
    APPEARANCE_GROUP_TITLE,
    CHARACTER_VIEW_OPTIONS,
    CHARACTER_VIEW_ROWS_HINT,
    CHARACTER_VIEW_SETTING_TITLE,
    DISPLAY_SETTINGS_ARIA,
    LIST_VIEW_SETTING_TITLE,
    SECTION_LAYOUT_OPTIONS,
    SECTION_LAYOUT_SETTING_TITLE,
    SECTION_LAYOUT_UNAVAILABLE_HINT,
    SECTIONS_GROUP_TITLE,
    THEME_OPTIONS,
    THEME_SECTION_TITLE,
  } from './constants';
  import { DisplaySettingsCustomTheme } from './custom-theme';
  import { DisplaySettingsLayoutPreview } from './layout-preview';
  import { DisplaySettingsListPreview } from './list-preview';

  type SectionLayout = (typeof SECTION_LAYOUT_OPTIONS)[number]['value'];

  /**
   * Настройки отображения в боковой панели, как на new.ttg.club: тема (в том
   * числе своя), раскладка разделов миниатюрами, вид списков и вид классов
   * и видов.
   */
  const { mode: themeMode, change: changeTheme } = useTheme();
  const { width: layoutWidth, change: changeLayoutWidth } = useLayoutWidth();

  const { isCollapsed: isFiltersCollapsed, setCollapsed: setFiltersCollapsed } =
    useSectionFiltersCollapsed();

  const { filtersSide, detailSide, setFiltersSide, setDetailSide } =
    useSectionColumnSides();

  const { isCentered, setCentered } = useSectionCentered();

  const { view: listView, setView: setListView } = useListView();

  const { view: characterView, change: changeCharacterView } =
    useCharacterListView();

  const isMounted = useMounted();
  const isMenuOnLeft = useMediaQuery(LAYOUT_DRAWER_QUERY);
  const isSplitScreen = useMediaQuery(LAYOUT_SPLIT_QUERY);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  // Колонки рядом бывают только на широком экране: на узком такие раскладки
  // гаснут, а не прячутся — видно, что они есть.
  const isWideAvailable = computed(
    () => isMounted.value && isSplitScreen.value,
  );

  const layoutHint = computed(() =>
    isWideAvailable.value ? undefined : SECTION_LAYOUT_UNAVAILABLE_HINT,
  );

  const layoutOptions = computed(() =>
    SECTION_LAYOUT_OPTIONS.map((option) => ({
      ...option,
      disabled: option.width === 'wide' && !isWideAvailable.value,
    })),
  );

  const theme = computed({
    get: () => themeMode.value,
    set: (value: ThemeMode) => changeTheme(value),
  });

  const isCustomTheme = computed(() => themeMode.value === 'custom');

  // Раскладка складывается из настроек: ширины сайта, узкой колонки, места
  // фильтров (над списком — это свёрнутая колонка) и стороны записи
  const layout = computed({
    get: (): SectionLayout => {
      if (layoutWidth.value !== 'wide') {
        return 'default';
      }

      if (isCentered.value) {
        return 'centered';
      }

      const filters = isFiltersCollapsed.value ? 'top' : filtersSide.value;

      return (
        SECTION_LAYOUT_OPTIONS.find(
          (option) =>
            option.width === 'wide'
            && option.filters === filters
            && !option.centered
            && option.detail === detailSide.value,
        )?.value ?? 'default'
      );
    },
    set: (value: SectionLayout) => {
      const option = SECTION_LAYOUT_OPTIONS.find(
        (entry) => entry.value === value,
      );

      if (!option) {
        return;
      }

      changeLayoutWidth(option.width);

      // Обычной ширине место колонок не важно — оставляем прежние
      if (option.width !== 'wide') {
        return;
      }

      setCentered(option.centered);

      // Узкой раскладке колонки фильтров не нужно — прежний выбор сохраняем
      if (option.centered) {
        setDetailSide(option.detail);

        return;
      }

      setFiltersCollapsed(option.filters === 'top');

      if (option.filters !== 'top') {
        setFiltersSide(option.filters);
      }

      setDetailSide(option.detail);
    },
  });

  const view = computed({
    get: () => listView.value,
    set: (value: ListView) => setListView(value),
  });

  const character = computed({
    get: () => characterView.value,
    set: (value: CharacterListView) => changeCharacterView(value),
  });

  const characterHint = computed(() =>
    listView.value === 'rows' ? CHARACTER_VIEW_ROWS_HINT : undefined,
  );
</script>

<template>
  <UPopover :content="{ side, align: 'start', sideOffset: 8 }">
    <UButton
      variant="ghost"
      icon="tabler:settings"
      color="neutral"
      :aria-label="DISPLAY_SETTINGS_ARIA"
    />

    <template #content>
      <!-- На телефоне панель не шире экрана, а высокая (своя тема) прокручивается -->
      <div
        class="flex max-h-(--reka-popover-content-available-height) w-104 max-w-[calc(100vw-1rem)] flex-col gap-4 overflow-y-auto p-3"
      >
        <section class="flex flex-col gap-3">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ APPEARANCE_GROUP_TITLE }}
          </h3>

          <DisplaySettingsChoice
            v-model="theme"
            :title="THEME_SECTION_TITLE"
            :options="THEME_OPTIONS"
            shape="pill"
          />

          <DisplaySettingsCustomTheme v-if="isCustomTheme" />
        </section>

        <USeparator />

        <section class="flex flex-col gap-3">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ SECTIONS_GROUP_TITLE }}
          </h3>

          <DisplaySettingsChoice
            v-model="layout"
            :title="SECTION_LAYOUT_SETTING_TITLE"
            :options="layoutOptions"
            :hint="layoutHint"
          >
            <template #preview="{ option }">
              <DisplaySettingsLayoutPreview
                :filters="option.filters"
                :detail="option.detail"
                :overlay="option.width !== 'wide'"
                :centered="option.centered"
              />
            </template>
          </DisplaySettingsChoice>

          <DisplaySettingsChoice
            v-model="view"
            :title="LIST_VIEW_SETTING_TITLE"
            :options="LIST_VIEW_OPTIONS"
          >
            <template #preview="{ option }">
              <DisplaySettingsListPreview :columns="option.columns" />
            </template>
          </DisplaySettingsChoice>

          <DisplaySettingsChoice
            v-model="character"
            :title="CHARACTER_VIEW_SETTING_TITLE"
            :options="CHARACTER_VIEW_OPTIONS"
            :hint="characterHint"
            shape="pill"
          />
        </section>
      </div>
    </template>
  </UPopover>
</template>
