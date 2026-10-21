import type { ThemeMode } from '#shared/consts';

/** Пункт переключателя темы. */
export interface ThemeOption {
  label: string;
  icon: string;
  /** Режим, который включается следующим нажатием. */
  next: ThemeMode;
}

/** Подписи, иконки и порядок режимов темы в переключателе. */
export const THEME_OPTIONS: Readonly<Record<ThemeMode, ThemeOption>> = {
  dark: { label: 'Тёмная тема', icon: 'tabler:moon', next: 'light' },
  light: { label: 'Светлая тема', icon: 'tabler:sun', next: 'auto' },
  auto: {
    label: 'Как в системе',
    icon: 'tabler:device-desktop',
    next: 'dark',
  },
};
