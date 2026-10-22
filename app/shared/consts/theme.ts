import type { ThemeMode } from '#shared/consts';

/** Пункт выбора темы. */
export interface ThemeOption {
  label: string;
  icon: string;
}

/** Подписи и иконки режимов темы в настройках отображения. */
export const THEME_OPTIONS: Readonly<Record<ThemeMode, ThemeOption>> = {
  dark: { label: 'Тёмная', icon: 'tabler:moon' },
  light: { label: 'Светлая', icon: 'tabler:sun' },
  auto: { label: 'Как в системе', icon: 'tabler:device-desktop' },
};
