<script setup lang="ts">
  import type { ThemeMode } from '#shared/consts';
  import type { ListView } from '~/shared/consts';

  import {
    LAYOUT_DRAWER_QUERY,
    LAYOUT_SPLIT_QUERY,
    LIST_VIEW_OPTIONS,
  } from '~/shared/consts';

  import { DisplaySettingsChoice } from './choice';
  import { useSectionLayout } from './composables';
  import {
    APPEARANCE_GROUP_TITLE,
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

  /**
   * Настройки отображения в боковой панели, как на new.ttg.club: тема (в том
   * числе своя), раскладка разделов миниатюрами и вид списков.
   */
  const { mode: themeMode, change: changeTheme } = useTheme();
  const { view: listView, setView: setListView } = useListView();

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

  const layout = useSectionLayout();

  const view = computed({
    get: () => listView.value,
    set: (value: ListView) => setListView(value),
  });
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
        </section>
      </div>
    </template>
  </UPopover>
</template>
