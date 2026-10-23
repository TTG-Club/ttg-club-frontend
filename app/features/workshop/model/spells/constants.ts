/** Ключ раздела заклинаний в мастерской. */
export const SPELLS_WORKSHOP_KEY = 'spells';

/** Раздел справочника с заклинаниями. */
export const SPELLS_REFERENCE_PATH = '/spells';

/** Наибольший круг заклинания; заговоры — нулевой. */
export const SPELL_MAX_LEVEL = 9;

/** Школа магии: код бэкенда и название, как его отдаёт карточка. */
export interface SpellSchoolOption {
  label: string;
  value: string;
  detailValue: string;
}

/** Школы магии. */
export const SPELL_SCHOOL_OPTIONS: ReadonlyArray<SpellSchoolOption> = [
  { label: 'Вызов', value: 'CONJURATION', detailValue: 'вызов' },
  { label: 'Воплощение', value: 'EVOCATION', detailValue: 'воплощение' },
  { label: 'Иллюзия', value: 'ILLUSION', detailValue: 'иллюзия' },
  { label: 'Некромантия', value: 'NECROMANCY', detailValue: 'некромантия' },
  { label: 'Ограждение', value: 'ABJURATION', detailValue: 'ограждение' },
  { label: 'Очарование', value: 'ENCHANTMENT', detailValue: 'очарование' },
  {
    label: 'Преобразование',
    value: 'TRANSMUTATION',
    detailValue: 'преобразование',
  },
  { label: 'Прорицание', value: 'DIVINATION', detailValue: 'прорицание' },
];

/** Школа нового заклинания. */
export const SPELL_DEFAULT_SCHOOL = 'EVOCATION';

/**
 * Единица времени накладывания: код бэкенда и все формы названия, которые
 * встречаются в карточке («10 минут», «8 часов», «24 часа»).
 */
export interface SpellTimeUnitOption {
  label: string;
  value: string;
  names: ReadonlyArray<string>;
}

/** Единицы времени накладывания. */
export const SPELL_TIME_UNIT_OPTIONS: ReadonlyArray<SpellTimeUnitOption> = [
  { label: 'Бонусное действие', value: 'BONUS', names: ['бонусное действие'] },
  { label: 'Реакция', value: 'REACTION', names: ['реакция'] },
  { label: 'Действие', value: 'ACTION', names: ['действие'] },
  { label: 'Ход', value: 'ROUND', names: ['ход'] },
  { label: 'Минута', value: 'MINUTE', names: ['минута', 'минут'] },
  { label: 'Час', value: 'HOUR', names: ['час', 'часов', 'часа'] },
  { label: 'При попадании', value: 'ON_HIT', names: ['при попадании'] },
];

/** Единица времени нового заклинания. */
export const SPELL_DEFAULT_TIME_UNIT = 'ACTION';

/** Число единиц времени нового заклинания. */
export const SPELL_DEFAULT_TIME_NUMBER = 1;

/**
 * Разделитель нескольких вариантов времени в карточке: «или» перед числом
 * или «при попадании». Внутри условия «или» встречается и само по себе.
 */
export const SPELL_TIME_ALTERNATIVE_SEPARATOR = / или (?=\d|при попадании)/;

/** Отделяет условие от единицы: «1 реакция, которую вы совершаете…». */
export const SPELL_TIME_CONDITION_SEPARATOR = ',';

/** Строки описания в редакторе. */
export const SPELL_DESCRIPTION_ROWS = 10;

/** Строки «На больших уровнях» в редакторе. */
export const SPELL_UPPER_ROWS = 5;

/** Подписи редактора заклинаний. */
export const SPELL_EDITOR_TEXT = {
  createTitle: 'Создание заклинания',
  editTitle: 'Редактирование заклинания',
  name: 'Название',
  englishName: 'Английское название',
  level: 'Уровень',
  levelHelp: '0 — заговор',
  school: 'Школа',
  additionalType: 'Дополнительный тип',
  ritual: 'Ритуал',
  concentration: 'Концентрация',
  verbal: 'Вербальный',
  somatic: 'Соматический',
  consumable: 'Расходуемый компонент',
  material: 'Материальный компонент',
  timeNumber: 'Время: число',
  timeUnit: 'Время: единица',
  timeCondition: 'Условие времени',
  range: 'Дистанция',
  duration: 'Длительность',
  description: 'Описание',
  upper: 'На больших уровнях',
  created: 'Заклинание создано',
  saved: 'Заклинание обновлено',
  saveError: 'Не удалось сохранить заклинание',
} as const;

/** Сообщения проверки формы заклинания. */
export const SPELL_VALIDATION = {
  required: 'Заполните поле',
  level: `От 0 до ${SPELL_MAX_LEVEL}`,
  timeNumber: 'Не меньше 1',
} as const;
