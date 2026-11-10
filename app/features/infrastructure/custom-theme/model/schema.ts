import type { CustomThemeSettings } from './types';

import { z } from 'zod';

import {
  CUSTOM_THEME_DEFAULT_LIGHTNESS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
} from './constants';

/**
 * Настройки своей темы из куки: значение приходит извне и проверяется.
 * Поля, которых не было в прежних версиях (основа, яркость фона), получают
 * значения по умолчанию — сохранённая тема не сбрасывается.
 */
const customThemeSettingsSchema = z.object({
  base: z.enum(['dark', 'light']).default('dark'),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  backgroundLightness: z.number().min(0).max(100).optional(),
  backgroundHue: z.number().min(0).max(360),
  backgroundTint: z.number().min(0).max(100),
});

/**
 * Разбирает сохранённые настройки своей темы. Испорченное значение заменяется
 * настройками по умолчанию.
 *
 * @param value Значение из куки.
 * @returns Проверенные настройки.
 */
export function parseCustomThemeSettings(value: unknown): CustomThemeSettings {
  const result = customThemeSettingsSchema.safeParse(value);

  if (!result.success) {
    return CUSTOM_THEME_DEFAULT_SETTINGS;
  }

  const { backgroundLightness, ...settings } = result.data;

  return {
    ...settings,
    backgroundLightness:
      backgroundLightness ?? CUSTOM_THEME_DEFAULT_LIGHTNESS[settings.base],
  };
}
