import type { SelectOption } from '../types';

import { WORKSHOP_MECHANICS_TAB } from '../constants';

/** Ключ раздела классов в мастерской. */
export const CLASSES_WORKSHOP_KEY = 'classes';

/** Раздел справочника с классами. */
export const CLASSES_REFERENCE_PATH = '/classes';

/** Раздел ручек мастерской для архетипов. */
export const ARCHETYPES_API_SECTION = 'classes/archetypes';

/** Уровни класса: столбцы таблицы и уровни умений. */
export const CLASS_LEVELS: ReadonlyArray<number> = Array.from(
  { length: 20 },
  (_, index) => index + 1,
);

/** Пустая ячейка таблицы: карточка показывает «—». */
export const EMPTY_CLASS_TABLE_VALUE = 0;

/** Бесконечность в таблице: карточка показывает «∞». */
export const INFINITE_CLASS_TABLE_VALUE = -1;

/** Наибольшее значение ячейки: бэкенд хранит её байтом. */
export const MAX_CLASS_TABLE_VALUE = 127;

/** Вариант выбора с числовым значением: кость хитов, уровень. */
export interface NumberSelectOption {
  label: string;
  value: number;
}

/** Уровни для выбора уровня умения. */
export const CLASS_LEVEL_OPTIONS: ReadonlyArray<NumberSelectOption> =
  CLASS_LEVELS.map((level) => ({ label: String(level), value: level }));

/** Кости хитов. */
export const CLASS_DICE_OPTIONS: ReadonlyArray<NumberSelectOption> = [
  { label: 'к6', value: 6 },
  { label: 'к8', value: 8 },
  { label: 'к10', value: 10 },
  { label: 'к12', value: 12 },
];

/** Типы заклинателей. */
export const CLASS_SPELLCASTER_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Нет', value: 'NONE' },
  { label: 'Полный', value: 'FULL' },
  { label: 'Половинный', value: 'HALF' },
  { label: 'Частичный', value: 'PARTLY' },
];

/** Восстановление ячеек заклинаний. */
export const CLASS_REST_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Короткий отдых', value: 'SHORT' },
  { label: 'Продолжительный отдых', value: 'LONG' },
  { label: 'Полный отдых', value: 'FULL' },
];

/** Уровень в таблице заклинаний архетипа. */
export const ARCHETYPE_SPELL_LEVEL_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Уровень класса', value: 'CLASS_LEVEL' },
  { label: 'Уровень заклинания', value: 'SPELL_LEVEL' },
];

/** Значения нового класса, как в старом SPA. */
export const CLASS_DEFAULT = {
  diceHp: 8,
  spellcasterType: 'NONE',
  spellLevelType: 'CLASS_LEVEL',
  level: 1,
} as const;

/** Подпись уровня: в таблице прогрессии и в шапке умения. */
export const CLASS_LEVEL_SUFFIX = 'ур.';

/** Вкладки редакторов класса и архетипа. */
export const CLASS_EDITOR_TAB = {
  main: 'main',
  proficiencies: 'proficiencies',
  spellcasting: 'spellcasting',
  table: 'table',
  traits: 'traits',
  equipment: 'equipment',
} as const;

/** Подписи вкладок редакторов класса и архетипа. */
export const CLASS_EDITOR_TAB_TEXT = {
  main: 'Основное',
  proficiencies: 'Владения',
  spellcasting: 'Заклинательство',
  table: 'Таблица',
  traits: 'Умения',
  equipment: 'Снаряжение',
} as const;

/**
 * Вкладки полей формы класса: при ошибке открывается вкладка с ней.
 * Названия стоят над вкладками и видны всегда.
 */
export const CLASS_FIELD_TABS: Readonly<Record<string, string>> = {
  accusativeName: CLASS_EDITOR_TAB.main,
  diceHp: CLASS_EDITOR_TAB.main,
  archetypeName: CLASS_EDITOR_TAB.main,
  enabledArhitypeLevel: CLASS_EDITOR_TAB.main,
  page: CLASS_EDITOR_TAB.main,
  optionType: CLASS_EDITOR_TAB.main,
  icon: CLASS_EDITOR_TAB.main,
  sidekick: CLASS_EDITOR_TAB.main,
  description: CLASS_EDITOR_TAB.main,
  primaryAbilities: CLASS_EDITOR_TAB.proficiencies,
  savingThrows: CLASS_EDITOR_TAB.proficiencies,
  skillAvailableCount: CLASS_EDITOR_TAB.proficiencies,
  availableSkills: CLASS_EDITOR_TAB.proficiencies,
  armor: CLASS_EDITOR_TAB.proficiencies,
  weapon: CLASS_EDITOR_TAB.proficiencies,
  tools: CLASS_EDITOR_TAB.proficiencies,
  spellcasterType: CLASS_EDITOR_TAB.spellcasting,
  spellAbility: CLASS_EDITOR_TAB.spellcasting,
  slotsReset: CLASS_EDITOR_TAB.spellcasting,
  equipment: CLASS_EDITOR_TAB.equipment,
  tableColumns: CLASS_EDITOR_TAB.table,
  classTraits: CLASS_EDITOR_TAB.traits,
  mechanics: WORKSHOP_MECHANICS_TAB.mechanics,
  activeEffects: WORKSHOP_MECHANICS_TAB.activeEffects,
};

/** Вкладки полей формы архетипа. */
export const ARCHETYPE_FIELD_TABS: Readonly<Record<string, string>> = {
  genitiveName: CLASS_EDITOR_TAB.main,
  level: CLASS_EDITOR_TAB.main,
  page: CLASS_EDITOR_TAB.main,
  spellLevelType: CLASS_EDITOR_TAB.main,
  description: CLASS_EDITOR_TAB.main,
  tableColumns: CLASS_EDITOR_TAB.table,
  traits: CLASS_EDITOR_TAB.traits,
  mechanics: WORKSHOP_MECHANICS_TAB.mechanics,
  activeEffects: WORKSHOP_MECHANICS_TAB.activeEffects,
};

/** Подписи редактора классов. */
export const CLASS_EDITOR_TEXT = {
  createTitle: 'Создание класса',
  editTitle: 'Редактирование класса',
  accusativeName: 'Название в винительном падеже',
  diceHp: 'Кость хитов',
  primaryAbilities: 'Основные характеристики',
  savingThrows: 'Спасброски',
  skillAvailableCount: 'Доступно навыков',
  availableSkills: 'Навыки на выбор',
  spellcasterType: 'Тип заклинателя',
  spellAbility: 'Характеристика заклинаний',
  archetypeName: 'Название архетипа',
  archetypeLevel: 'Уровень выбора архетипа',
  optionType: 'Особенности класса',
  slotsReset: 'Восстановление ячеек',
  icon: 'Иконка',
  sidekick: 'Напарник',
  armor: 'Доспехи',
  weapon: 'Оружие',
  tools: 'Инструменты',
  equipment: 'Снаряжение',
  created: 'Класс создан',
  saved: 'Класс обновлён',
  saveError: 'Не удалось сохранить класс',
} as const;

/** Подписи редактора архетипов. */
export const ARCHETYPE_EDITOR_TEXT = {
  editTitle: 'Редактирование архетипа',
  genitiveName: 'Название в родительном падеже',
  level: 'Уровень получения',
  spellLevelType: 'Уровень в таблице заклинаний',
  saved: 'Архетип обновлён',
  saveError: 'Не удалось сохранить архетип',
} as const;

/** Подписи редактора умений. */
export const CLASS_TRAITS_TEXT = {
  title: 'Умения',
  add: 'Добавить умение',
  remove: 'Удалить умение',
  suffix: 'Суффикс',
  child: 'Дочерний якорь',
  optional: 'Опциональное умение',
  optionalBadge: 'Опциональное',
  empty: 'Умения не добавлены',
} as const;

/** Подписи раздела роста умения по уровням. */
export const CLASS_SCALING_TEXT = {
  title: 'Рост по уровням',
  hint: 'Уровни, на которых умение повторяется или усиливается: «Увеличение характеристик» на 8, 12, 16 и 19 уровнях, вторая «Дополнительная атака». Каждая строка — отдельная запись в таблице класса со ссылкой на это умение.',
  add: 'Добавить уровень',
  remove: 'Убрать уровень',
  level: 'Уровень',
  name: 'Название',
  namePlaceholder: 'Пусто — как у умения',
  additional: 'Подсказка',
  additionalPlaceholder: 'Подпись после названия, например «(2)»',
  hideInSubclasses: 'Скрывать в подклассе',
  description: 'Описание',
  descriptionPlaceholder: 'Что меняется на этом уровне',
  empty: 'Умение не повторяется',
} as const;

/** Подписи раздела вариантов умения. */
export const CLASS_OPTIONS_TEXT = {
  title: 'Варианты',
  hint: 'Список вариантов умения, из которых выбирают по ходу игры: манёвры, воззвания, метамагия, боевые стили. Варианты правятся только здесь — раздел «Особенности классов» обновляется из них при сохранении класса.',
  add: 'Добавить вариант',
  remove: 'Убрать вариант',
  type: 'Тип списка',
  typeHint:
    'Связывает варианты с разделом «Особенности классов» и его фильтром по классу',
  typePlaceholder: 'Без типа',
  name: 'Название списка',
  namePlaceholder: 'Например, «Воззвания»',
  import: 'Перенести варианты типа',
  importHint:
    'Забрать в умение все записи раздела «Особенности классов» с этим типом',
  importDone: (count: number) => `Перенесено вариантов: ${count}`,
  importFailed: 'Не удалось получить варианты типа',
  importEmpty: 'У типа нет записей в разделе',
  selectable: 'Из списка выбирают',
  selectableHint:
    'Лист персонажа спросит варианты на нужном уровне. Без галочки варианты остаются справкой.',
  choiceLabel: 'Подпись выбора',
  choiceLabelPlaceholder: 'Пусто — название списка',
  count: 'Сколько выбрать',
  countHint: 'На уровне самого умения',
  stepsTitle: 'Рост количества по уровням',
  stepsHint: 'Ступень — сколько вариантов выбрано ВСЕГО к этому уровню',
  stepLevel: 'Уровень',
  stepCount: 'Всего',
  addStep: 'Добавить ступень',
  removeStep: 'Убрать ступень',
  optionName: 'Название',
  optionEnglishName: 'Английское название',
  optionAltName: 'Другое название',
  optionLevel: 'С уровня',
  optionLevelPlaceholder: 'С уровня умения',
  prerequisite: 'Требования',
  prerequisitePlaceholder: 'Например: заклинание «Мистический заряд»',
  additional: 'Подсказка',
  additionalPlaceholder: 'Короткая подпись в списке',
  repeatable: 'Можно взять повторно',
  hideInSubclasses: 'Скрывать в подклассе',
  description: 'Описание',
  source: 'Книга',
  sourcePlaceholder: 'Как у класса',
  page: 'Страница',
  unnamed: 'Без названия',
  empty: 'Вариантов нет',
} as const;

/** Подписи редактора таблицы прогрессии. */
export const CLASS_TABLE_TEXT = {
  title: 'Таблица прогрессии',
  description: `Значение ${EMPTY_CLASS_TABLE_VALUE} показывается как «—», а ${INFINITE_CLASS_TABLE_VALUE} — как «∞».`,
  add: 'Добавить колонку',
  remove: 'Удалить колонку',
  column: 'Колонка',
  prefix: 'Префикс значения',
  suffix: 'Суффикс значения',
  levelSuffix: CLASS_LEVEL_SUFFIX,
  empty: 'Дополнительные колонки не добавлены',
} as const;

/** Иконки списков редактора классов. */
export const CLASS_LIST_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
} as const;
