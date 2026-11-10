import type { DisplaySettingsChoiceShape } from './types';

/** Раскладка вариантов: плитки — по четыре в ряд, пилюли — в ряд. */
export const DISPLAY_SETTINGS_CHOICE_FIELDSET_CLASS: Record<
  DisplaySettingsChoiceShape,
  string
> = {
  tile: 'flex w-full flex-wrap gap-1.5',
  pill: 'flex flex-wrap gap-1.5',
};

/** Сам вариант: плитка с картинкой или пилюля со значком и названием. */
export const DISPLAY_SETTINGS_CHOICE_ITEM_CLASS: Record<
  DisplaySettingsChoiceShape,
  string
> = {
  tile: 'basis-[calc((100%-1.125rem)/4)] p-1.5',
  pill: 'items-center rounded-full px-3 py-1.5',
};

/** Содержимое варианта: картинка плитки — во всю ширину, значок пилюли — слева от названия. */
export const DISPLAY_SETTINGS_CHOICE_WRAPPER_CLASS: Record<
  DisplaySettingsChoiceShape,
  string
> = {
  tile: 'w-full items-stretch',
  pill: 'flex-row gap-1.5',
};

/** Подпись варианта: у плитки держит картинку во всю ширину, у пилюли — видна. */
export const DISPLAY_SETTINGS_CHOICE_LABEL_CLASS: Record<
  DisplaySettingsChoiceShape,
  string
> = {
  tile: 'w-full',
  pill: 'font-normal',
};
