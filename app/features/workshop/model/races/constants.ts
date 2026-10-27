import type { SelectOption } from '../types';

import { WORKSHOP_ABILITY_OPTIONS } from '../constants';

/** Ключ раздела рас в мастерской. */
export const RACES_WORKSHOP_KEY = 'races';

/** Раздел справочника с расами. */
export const RACES_REFERENCE_PATH = '/races';

/** Список рас: из него выбирается родительская раса. */
export const RACES_LIST_PATH = '/api/v1/races';

/** Бонусы характеристик расы: характеристики и варианты на выбор. */
export const RACE_ABILITY_OPTIONS: ReadonlyArray<SelectOption> = [
  ...WORKSHOP_ABILITY_OPTIONS,
  { label: 'К одной', value: 'ONE' },
  { label: 'К другой', value: 'CHOICE' },
  { label: 'К двум другим', value: 'CHOICE_UNIQUE' },
  { label: '+2 и +1 / +1 к трем', value: 'CHOICE_DOUBLE' },
];

/** Размеры существ. */
export const RACE_SIZE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Крошечный', value: 'TINY' },
  { label: 'Маленький', value: 'SMALL' },
  { label: 'Средний', value: 'MEDIUM' },
  { label: 'Большой', value: 'LARGE' },
  { label: 'Огромный', value: 'HUGE' },
  { label: 'Громадный', value: 'GARGANTUAN' },
  { label: 'Средний или маленький', value: 'SMALL_MEDIUM' },
];

/** Типы существ. */
export const RACE_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Аберрация', value: 'ABERRATION' },
  { label: 'Зверь', value: 'BEAST' },
  { label: 'Небожитель', value: 'CELESTIAL' },
  { label: 'Конструкт', value: 'CONSTRUCT' },
  { label: 'Дракон', value: 'DRAGON' },
  { label: 'Элементаль', value: 'ELEMENTAL' },
  { label: 'Фея', value: 'FEY' },
  { label: 'Исчадие', value: 'FIEND' },
  { label: 'Великан', value: 'GIANT' },
  { label: 'Гуманоид', value: 'HUMANOID' },
  { label: 'Монстр', value: 'MONSTROSITY' },
  { label: 'Тина', value: 'OOZE' },
  { label: 'Потусторонний', value: 'OUTSIDER' },
  { label: 'Растение', value: 'PLANT' },
  { label: 'Демон', value: 'DEVIL' },
  { label: 'Нежить', value: 'UNDEAD' },
  { label: 'Паразит', value: 'VERMIN' },
  { label: 'Слизь', value: 'SLIME' },
  { label: 'Стая крошечных зверей', value: 'SMALL_BEAST' },
  { label: 'Рой', value: 'SWARM' },
];

/** Значения новой расы, как в старом SPA. */
export const RACE_DEFAULT = {
  size: 'MEDIUM',
  type: 'HUMANOID',
  speed: 30,
  ability: 'STRENGTH',
  bonus: 1,
} as const;

/** Подписи редактора рас. */
export const RACE_EDITOR_TEXT = {
  createTitle: 'Создание расы',
  editTitle: 'Редактирование расы',
  parent: 'Родительская раса',
  parentHelp: 'Для разновидности расы',
  size: 'Размер',
  creatureType: 'Тип существа',
  minAge: 'Минимальный возраст',
  maxAge: 'Максимальный возраст',
  speed: 'Скорость, фт',
  darkvision: 'Тёмное зрение, фт',
  fly: 'Полёт, фт',
  climb: 'Лазание, фт',
  swim: 'Плавание, фт',
  icon: 'Иконка',
  origin: 'Происхождение',
  view: 'Скрывать в списке как отдельную расу',
  created: 'Раса создана',
  saved: 'Раса обновлена',
  saveError: 'Не удалось сохранить расу',
} as const;

/** Подписи бонусов характеристик расы. */
export const RACE_ABILITIES_TEXT = {
  title: 'Бонусы характеристик',
  add: 'Добавить бонус',
  remove: 'Удалить бонус',
  ability: 'Характеристика',
  bonus: 'Бонус',
  empty: 'Бонусы не добавлены',
} as const;

/** Подписи особенностей расы. */
export const RACE_FEATURES_TEXT = {
  title: 'Особенности',
  add: 'Добавить особенность',
  remove: 'Удалить особенность',
  replace: 'Заменяет особенность',
  replaceHelp: 'Идентификатор особенности родительской расы',
  opened: 'Открывать по умолчанию',
  openedBadge: 'Открыта',
  empty: 'Особенности не добавлены',
} as const;

/** Поле формы расы со списком особенностей. */
export const RACE_FEATURES_FIELD = 'features';

/** Вкладки редактора расы. */
export const RACE_EDITOR_TAB = {
  main: 'main',
  properties: 'properties',
  features: 'features',
} as const;

/** Подписи вкладок редактора расы. */
export const RACE_EDITOR_TAB_TEXT = {
  main: 'Основное',
  properties: 'Характеристики',
  features: 'Особенности',
} as const;

/**
 * Вкладки полей формы расы: при ошибке открывается вкладка с ней.
 * Названия стоят над вкладками и видны всегда.
 */
export const RACE_FIELD_TABS: Readonly<Record<string, string>> = {
  parentId: RACE_EDITOR_TAB.main,
  size: RACE_EDITOR_TAB.main,
  type: RACE_EDITOR_TAB.main,
  minAge: RACE_EDITOR_TAB.main,
  maxAge: RACE_EDITOR_TAB.main,
  icon: RACE_EDITOR_TAB.main,
  page: RACE_EDITOR_TAB.main,
  origin: RACE_EDITOR_TAB.main,
  view: RACE_EDITOR_TAB.main,
  description: RACE_EDITOR_TAB.main,
  speed: RACE_EDITOR_TAB.properties,
  darkvision: RACE_EDITOR_TAB.properties,
  fly: RACE_EDITOR_TAB.properties,
  climb: RACE_EDITOR_TAB.properties,
  swim: RACE_EDITOR_TAB.properties,
  abilities: RACE_EDITOR_TAB.properties,
  [RACE_FEATURES_FIELD]: RACE_EDITOR_TAB.features,
};

/** Иконки списков редактора рас. */
export const RACE_LIST_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
} as const;

/** Строки описания особенности расы. */
export const RACE_FEATURE_ROWS = 8;
