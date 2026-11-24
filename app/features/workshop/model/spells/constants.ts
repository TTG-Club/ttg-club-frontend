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

/** Кости броска урона: «8d6»; пусто — без костей. */
export const SPELL_DICE_PATTERN = /^(\d{1,2}d\d{1,3})?$/;

/** Наибольшее число бросков урона у заклинания. */
export const SPELL_DAMAGE_MAX_ROLLS = 10;

/** Подписи раздела урона в редакторе заклинания. */
export const SPELL_DAMAGE_TEXT = {
  title: 'Урон для листа персонажа',
  hint: 'По этим броскам лист персонажа показывает плитки урона и лечения. Взаимоисключающие броски (кость зависит от состояния цели) — отдельными строками с условием.',
  roll: 'Бросок',
  dice: 'Кости',
  dicePlaceholder: '8d6',
  bonus: 'Бонус',
  abilityModifier: '+ модификатор',
  types: 'Типы урона',
  typesPlaceholder: 'Тип урона',
  healing: 'Лечение',
  condition: 'Условие',
  conditionPlaceholder: 'Цель с неполными хитами',
  add: 'Добавить бросок',
  remove: 'Убрать бросок',
  cantripScaling: 'Рост заговора: кости ×2 / ×3 / ×4 на 5 / 11 / 17 уровне',
  upcastDice: 'За каждый круг выше',
  upcastHelp: 'Кости добавляются к первому броску',
  empty: 'Урона нет — заклинание в листе без плитки урона.',
} as const;

/** Типы урона заклинаний: основные коды бэкенда без легаси-дублей. */
export const SPELL_DAMAGE_TYPE_OPTIONS: ReadonlyArray<{
  label: string;
  value: string;
}> = [
  { label: 'Дробящий', value: 'BLUDGEONING' },
  { label: 'Колющий', value: 'PIERCING' },
  { label: 'Рубящий', value: 'SLASHING' },
  { label: 'Огонь', value: 'FAIR' },
  { label: 'Холод', value: 'COLD' },
  { label: 'Электричество', value: 'LIGHTNING' },
  { label: 'Яд', value: 'POISON' },
  { label: 'Кислота', value: 'ACID' },
  { label: 'Звук', value: 'THUNDER' },
  { label: 'Некротическая энергия', value: 'NECROTIC' },
  { label: 'Психическая энергия', value: 'PSYCHIC' },
  { label: 'Излучение', value: 'RADIANT' },
  { label: 'Силовое поле', value: 'FORCE' },
];

/** Сообщения проверки формы заклинания. */
export const SPELL_VALIDATION = {
  dice: 'Кости в виде 8d6',
  required: 'Заполните поле',
  level: `От 0 до ${SPELL_MAX_LEVEL}`,
  timeNumber: 'Не меньше 1',
} as const;
