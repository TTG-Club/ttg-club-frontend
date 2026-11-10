/** Вариант настройки отображения. */
export interface DisplaySettingsOption<T extends string> {
  value: T;
  /** Подпись: у плитки — в шапке настройки и для экранных читалок, у пилюли — на ней самой */
  label: string;
  /** Значок пилюли */
  icon?: string;
  /** Вариант сейчас недоступен */
  disabled?: boolean;
}

/** Как показать варианты: плитками с картинкой или пилюлями со значком и названием. */
export type DisplaySettingsChoiceShape = 'tile' | 'pill';
