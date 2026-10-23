import type { SelectOption } from '../types';

/** Ключ раздела предысторий в мастерской. */
export const BACKGROUNDS_WORKSHOP_KEY = 'backgrounds';

/** Раздел справочника с предысториями. */
export const BACKGROUNDS_REFERENCE_PATH = '/backgrounds';

/** Таблицы персонализации в порядке перечисления бэкенда. */
export const PERSONALIZATION_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Жизнь в уединении', value: 'LIFE_IN_SECLUSION' },
  { label: 'Занятие', value: 'EMPLOYMENT' },
  { label: 'Специализация', value: 'SPECIALIZATION' },
  { label: 'Перенятая культура', value: 'ADOPTED_CULTURE' },
  { label: 'Ценные предметы', value: 'VALUABLE_ITEMS' },
  { label: 'Афера', value: 'SCAM' },
  { label: 'Амплуа', value: 'AMPLOIS' },
  { label: 'Определяющее событие', value: 'DEFINING_EVENT' },
  { label: 'Черта характера', value: 'TRAIT' },
  { label: 'Идеал', value: 'IDEAL' },
  { label: 'Привязанность', value: 'AFFECTION' },
  { label: 'Слабость', value: 'WEAKNESS' },
  { label: 'Зачем вы здесь?', value: 'WHY_ARE_YOU_HERE' },
  { label: 'Откуда вы?', value: 'WHERE_ARE_YOU_FROM' },
  { label: 'Наследие', value: 'HERITAGE' },
  { label: 'Обезображенный', value: 'DISFIGURED' },
  { label: 'Убеждение', value: 'CREED' },
  { label: 'Безделушка', value: 'BAUBLE' },
];

/** Образ жизни. */
export const LIFE_STYLE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Никудышное', value: 'ANYTHING' },
  { label: 'Нищенское', value: 'BEGGARLY' },
  { label: 'Бедное', value: 'POOR' },
  { label: 'Скромное', value: 'MODEST' },
  { label: 'Комфортное', value: 'COMFORTABLE' },
  { label: 'Богатое', value: 'RICH' },
  { label: 'Аристократическое', value: 'ARISTOCRATIC' },
];

/** Столбец текста в строке таблицы персонализации: `[номер, текст]`. */
export const PERSONALIZATION_TEXT_COLUMN = 1;

/** Подписи редактора предысторий. */
export const BACKGROUND_EDITOR_TEXT = {
  createTitle: 'Создание предыстории',
  editTitle: 'Редактирование предыстории',
  otherSkills: 'Другие навыки',
  otherSkillsHelp: 'Текстом, если навык на выбор',
  toolOwnership: 'Владение инструментами',
  startGold: 'Стартовое золото',
  equipments: 'Снаряжение',
  listHelp: 'Через запятую',
  languages: 'Языки',
  language: 'Языки текстом',
  languageHelp: 'Например, «Два на ваш выбор»',
  lifeStyle: 'Образ жизни',
  skillName: 'Название умения предыстории',
  skillDescription: 'Описание умения предыстории',
  personalization: 'Персонализация',
  created: 'Предыстория создана',
  saved: 'Предыстория обновлена',
  saveError: 'Не удалось сохранить предысторию',
} as const;

/** Подписи редактора таблиц персонализации. */
export const PERSONALIZATION_TEXT = {
  title: 'Таблицы персонализации',
  description: 'Порядковый номер строки используется как результат броска.',
  addTable: 'Добавить таблицу',
  removeTable: 'Удалить таблицу',
  type: 'Таблица',
  addRow: 'Добавить строку',
  removeRow: 'Удалить строку',
  empty: 'Таблицы не добавлены',
} as const;

/** Иконки редактора таблиц персонализации. */
export const PERSONALIZATION_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
  empty: 'tabler:table-off',
} as const;

/** Строки полей предыстории в редакторе. */
export const BACKGROUND_SKILL_ROWS = 8;

export const PERSONALIZATION_ROW_ROWS = 2;
