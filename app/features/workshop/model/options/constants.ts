/** Ключ раздела особенностей классов в мастерской. */
export const OPTIONS_WORKSHOP_KEY = 'options';

/** Раздел справочника с особенностями классов. */
export const OPTIONS_REFERENCE_PATH = '/options';

/** Фильтры особенностей: из них берутся типы. */
export const OPTIONS_FILTER_PATH = '/api/v1/filters/options';

/** Группа фильтров с типами особенностей. */
export const OPTION_TYPES_FILTER_KEY = 'classOption';

/** Подписи редактора особенностей. */
export const OPTION_EDITOR_TEXT = {
  createTitle: 'Создание особенности',
  editTitle: 'Редактирование особенности',
  prerequisite: 'Требования',
  optionTypes: 'Типы особенности',
  created: 'Особенность создана',
  saved: 'Особенность обновлена',
  saveError: 'Не удалось сохранить особенность',
} as const;
