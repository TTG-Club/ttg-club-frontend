<script setup lang="ts">
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { ThemeMode } from '#shared/consts';
  import type { CharacterListView, LayoutWidth } from '~/shared/consts';

  import { THEME_MODES } from '#shared/consts';
  import {
    CHARACTER_LIST_VIEW_OPTIONS,
    CHARACTER_LIST_VIEWS,
    LAYOUT_DRAWER_QUERY,
    LAYOUT_WIDTH_OPTIONS,
    LAYOUT_WIDTHS,
    THEME_OPTIONS,
  } from '~/shared/consts';

  import { DISPLAY_SETTINGS_ICON, DISPLAY_SETTINGS_TEXT } from './constants';

  /**
   * Настройки отображения в боковой панели, как на new.ttg.club: тема и
   * ширина разделов — обычная с карточкой в дровере или широкая с карточкой
   * рядом со списком, — и вид списков классов и видов.
   */
  const { mode, change: changeTheme } = useTheme();
  const { width, change: changeWidth } = useLayoutWidth();

  const { view: characterView, change: changeCharacterView } =
    useCharacterListView();

  const isMenuOnLeft = useMediaQuery(LAYOUT_DRAWER_QUERY);

  const side = computed(() => (isMenuOnLeft.value ? 'right' : 'top'));

  /**
   * Пункт выбора темы.
   * @param theme - режим темы
   */
  function getThemeItem(theme: ThemeMode): DropdownMenuItem {
    return {
      label: THEME_OPTIONS[theme].label,
      icon: THEME_OPTIONS[theme].icon,
      type: 'checkbox',
      checked: mode.value === theme,
      onSelect: (event: Event) => {
        event.preventDefault();
        changeTheme(theme);
      },
    };
  }

  /**
   * Пункт выбора ширины разделов.
   * @param option - ширина
   */
  function getWidthItem(option: LayoutWidth): DropdownMenuItem {
    return {
      label: LAYOUT_WIDTH_OPTIONS[option].label,
      icon: LAYOUT_WIDTH_OPTIONS[option].icon,
      type: 'checkbox',
      checked: width.value === option,
      onSelect: (event: Event) => {
        event.preventDefault();
        changeWidth(option);
      },
    };
  }

  /**
   * Пункт выбора вида списков классов и видов.
   * @param option - вид списка
   */
  function getCharacterViewItem(option: CharacterListView): DropdownMenuItem {
    return {
      label: CHARACTER_LIST_VIEW_OPTIONS[option].label,
      icon: CHARACTER_LIST_VIEW_OPTIONS[option].icon,
      type: 'checkbox',
      checked: characterView.value === option,
      onSelect: (event: Event) => {
        event.preventDefault();
        changeCharacterView(option);
      },
    };
  }

  const items = computed<Array<Array<DropdownMenuItem>>>(() => [
    [
      { label: DISPLAY_SETTINGS_TEXT.theme, type: 'label' },
      ...THEME_MODES.map(getThemeItem),
    ],
    [
      { label: DISPLAY_SETTINGS_TEXT.width, type: 'label' },
      ...LAYOUT_WIDTHS.map(getWidthItem),
    ],
    [
      { label: DISPLAY_SETTINGS_TEXT.characterView, type: 'label' },
      ...CHARACTER_LIST_VIEWS.map(getCharacterViewItem),
    ],
  ]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side, align: 'start', sideOffset: 8 }"
    :ui="{ content: 'w-56' }"
  >
    <UButton
      :icon="DISPLAY_SETTINGS_ICON"
      :aria-label="DISPLAY_SETTINGS_TEXT.title"
      color="neutral"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
