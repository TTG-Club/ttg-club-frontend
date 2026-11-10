import type { CustomThemeBase, CustomThemeSettings } from './types';

import Color from 'colorjs.io';
import { z } from 'zod';

import {
  CUSTOM_THEME_DEFAULT_LIGHTNESS,
  CUSTOM_THEME_DEFAULT_SETTINGS,
  CUSTOM_THEME_LEGACY_MAX_TINT_CHROMA,
  CUSTOM_THEME_SURFACES,
} from './constants';

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

/** Настройки своей темы из cookie: значение приходит извне и проверяется. */
const customThemeSettingsSchema = z.object({
  background: hexColorSchema,
  accent: hexColorSchema,
});

/**
 * Прежний вид настроек: фон задавался основой, яркостью, оттенком и
 * насыщенностью. Самые старые cookie не знали основы и яркости.
 */
const legacyCustomThemeSettingsSchema = z.object({
  base: z.enum(['dark', 'light']).default('dark'),
  accent: hexColorSchema,
  backgroundLightness: z.number().min(0).max(100).optional(),
  backgroundHue: z.number().min(0).max(360),
  backgroundTint: z.number().min(0).max(100),
});

/**
 * Цвет фона, который давали настройки прежнего вида, — чтобы сохранённая
 * тема не изменилась.
 *
 * @param base - Основа
 * @param lightness - Яркость фона внутри основы, 0–100
 * @param hue - Оттенок фона
 * @param tint - Насыщенность фона, 0–100
 * @returns Цвет фона в формате `#rrggbb`
 */
function legacyBackgroundColor(
  base: CustomThemeBase,
  lightness: number,
  hue: number,
  tint: number,
): string {
  const [darkest, lightest] = CUSTOM_THEME_SURFACES[base].pageRange;

  return new Color('oklch', [
    darkest + ((lightest - darkest) * lightness) / 100,
    (CUSTOM_THEME_LEGACY_MAX_TINT_CHROMA * tint) / 100,
    hue,
  ])
    .to('srgb')
    .toGamut({ space: 'srgb' })
    .toString({ format: 'hex', collapse: false });
}

/**
 * Разбирает сохранённые настройки своей темы. Настройки прежнего вида
 * переводятся в цвет фона, испорченное значение заменяется настройками по
 * умолчанию.
 *
 * @param value - Значение из cookie
 * @returns Проверенные настройки
 */
export function parseCustomThemeSettings(value: unknown): CustomThemeSettings {
  const current = customThemeSettingsSchema.safeParse(value);

  if (current.success) {
    return {
      background: current.data.background.toLowerCase(),
      accent: current.data.accent.toLowerCase(),
    };
  }

  const legacy = legacyCustomThemeSettingsSchema.safeParse(value);

  if (!legacy.success) {
    return CUSTOM_THEME_DEFAULT_SETTINGS;
  }

  const { base, accent, backgroundLightness, backgroundHue, backgroundTint } =
    legacy.data;

  return {
    background: legacyBackgroundColor(
      base,
      backgroundLightness ?? CUSTOM_THEME_DEFAULT_LIGHTNESS[base],
      backgroundHue,
      backgroundTint,
    ),
    accent: accent.toLowerCase(),
  };
}
