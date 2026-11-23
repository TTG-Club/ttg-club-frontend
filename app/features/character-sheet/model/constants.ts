/** Адреса и названия раздела. */
export const CHARACTER_SHEET_ROUTE = '/tools/character-sheet';

export const CHARACTER_SHEET_API_URL = '/api/v1/character-sheets';

export const CHARACTER_SHEET_ICON = 'tabler:user-square-rounded';

/** Версия формата документа листа: при несовместимых изменениях растёт. */
export const SHEET_SCHEMA_VERSION = 1;

/** Сколько листов можно вести; точное число присылает бэкенд в списке. */
export const SHEET_LIMIT_FALLBACK = 10;

/** Пауза автосохранения после последней правки, мс. */
export const SHEET_SAVE_DELAY = 1500;

/** Пауза поиска по справочнику после ввода, мс. */
export const SHEET_SEARCH_DEBOUNCE = 300;

/** Сколько записей справочника показывать в поиске. */
export const SHEET_SEARCH_SIZE = 30;

/** HTTP-статусы, на которые лист реагирует особо. */
export const SHEET_HTTP_STATUS = {
  unauthorized: 401,
  notFound: 404,
  conflict: 409,
} as const;

export const SHEET_TEXT = {
  title: 'Лист персонажа',
  listTitle: 'Листы персонажей',
  listDescription:
    'Персонажи по правилам 5e 2014: характеристики, навыки, хиты, снаряжение и заклинания. Листы хранятся в вашем аккаунте.',
  create: 'Создать персонажа',
  limit: 'Достигнут лимит листов: удалите один из существующих',
  empty: 'Листов пока нет',
  loadFailed: 'Не удалось загрузить листы',
  sheetLoadFailed: 'Не удалось загрузить лист',
  notFound: 'Лист не найден',
  notFoundDescription:
    'Возможно, он удалён или принадлежит другому пользователю',
  authRequired: 'Листы персонажей доступны после входа',
  authDescription: 'Войдите, чтобы создавать персонажей и вести их листы.',
  signIn: 'Войти',
  retry: 'Повторить',
  backToList: 'К списку листов',
  errorCreate: 'Не удалось создать лист',
  errorDelete: 'Не удалось удалить лист',
  errorCopy: 'Не удалось создать копию',
  errorSave: 'Не удалось сохранить лист',
  conflict:
    'Лист изменили в другом окне. Перезагрузите его, чтобы не затереть правки.',
  reload: 'Перезагрузить',
  open: 'Открыть',
  copy: 'Копия',
  copySuffix: ' (копия)',
  remove: 'Удалить',
  removeTitle: 'Удалить лист?',
  removeDescription: 'Лист будет удалён без возможности восстановления.',
  cancel: 'Отмена',
  confirm: 'Удалить',
  defaultName: 'Новый персонаж',
  noClass: 'Без класса',
  levelShort: 'ур.',
  updatedAt: 'Изменён',
} as const;

export const SHEET_SAVE_STATUS_TEXT = {
  idle: '',
  pending: 'Есть несохранённые изменения',
  saving: 'Сохранение…',
  saved: 'Сохранено',
  error: 'Ошибка сохранения',
  conflict: 'Конфликт версий',
} as const;

export const SHEET_SAVE_STATUS_ICON = {
  idle: 'tabler:cloud',
  pending: 'tabler:cloud-upload',
  saving: 'tabler:loader-2',
  saved: 'tabler:cloud-check',
  error: 'tabler:cloud-x',
  conflict: 'tabler:alert-triangle',
} as const;

/* --- Характеристики и навыки -------------------------------------------- */

/** Ключи характеристик совпадают с перечислением бэкенда (AbilityType). */
export const ABILITY_KEYS = [
  'STRENGTH',
  'DEXTERITY',
  'CONSTITUTION',
  'INTELLIGENCE',
  'WISDOM',
  'CHARISMA',
] as const;

export const ABILITY_LABELS = {
  STRENGTH: { name: 'Сила', short: 'Сил' },
  DEXTERITY: { name: 'Ловкость', short: 'Лов' },
  CONSTITUTION: { name: 'Телосложение', short: 'Тел' },
  INTELLIGENCE: { name: 'Интеллект', short: 'Инт' },
  WISDOM: { name: 'Мудрость', short: 'Мдр' },
  CHARISMA: { name: 'Харизма', short: 'Хар' },
} as const;

export const ABILITY_SCORE = { min: 1, max: 30, default: 10 } as const;

/** Ключи навыков совпадают с перечислением бэкенда (SkillType). */
export const SKILL_KEYS = [
  'ACROBATICS',
  'ANIMAL_HANDLING',
  'ARCANA',
  'ATHLETICS',
  'DECEPTION',
  'HISTORY',
  'INSIGHT',
  'INTIMIDATION',
  'INVESTIGATION',
  'MEDICINE',
  'NATURE',
  'PERCEPTION',
  'PERFORMANCE',
  'PERSUASION',
  'RELIGION',
  'SLEIGHT_OF_HAND',
  'STEALTH',
  'SURVIVAL',
] as const;

/**
 * Навык: характеристика и русские названия. Первое название — основное,
 * остальные встречаются в текстах справочника (старые переводы).
 */
export const SKILL_INFO = {
  ACROBATICS: { ability: 'DEXTERITY', names: ['Акробатика'] },
  ANIMAL_HANDLING: {
    ability: 'WISDOM',
    names: ['Уход за животными', 'Обращение с животными'],
  },
  ARCANA: { ability: 'INTELLIGENCE', names: ['Магия'] },
  ATHLETICS: { ability: 'STRENGTH', names: ['Атлетика'] },
  DECEPTION: { ability: 'CHARISMA', names: ['Обман'] },
  HISTORY: { ability: 'INTELLIGENCE', names: ['История'] },
  INSIGHT: { ability: 'WISDOM', names: ['Проницательность'] },
  INTIMIDATION: { ability: 'CHARISMA', names: ['Запугивание', 'Устрашение'] },
  INVESTIGATION: {
    ability: 'INTELLIGENCE',
    names: ['Анализ', 'Расследование'],
  },
  MEDICINE: { ability: 'WISDOM', names: ['Медицина'] },
  NATURE: { ability: 'INTELLIGENCE', names: ['Природа', 'Естествознание'] },
  PERCEPTION: { ability: 'WISDOM', names: ['Внимательность', 'Восприятие'] },
  PERFORMANCE: { ability: 'CHARISMA', names: ['Выступление'] },
  PERSUASION: { ability: 'CHARISMA', names: ['Убеждение'] },
  RELIGION: { ability: 'INTELLIGENCE', names: ['Религия'] },
  SLEIGHT_OF_HAND: {
    ability: 'DEXTERITY',
    names: ['Ловкость рук', 'Ловкость Рук'],
  },
  STEALTH: { ability: 'DEXTERITY', names: ['Скрытность'] },
  SURVIVAL: { ability: 'WISDOM', names: ['Выживание'] },
} as const;

/** Уровни владения навыком и их множитель бонуса мастерства. */
export const SKILL_PROFICIENCY_MULTIPLIER = {
  none: 0,
  proficient: 1,
  expertise: 2,
} as const;

/** Порядок переключения владения навыком по клику. */
export const SKILL_PROFICIENCY_CYCLE = [
  'none',
  'proficient',
  'expertise',
] as const;

export const SKILL_PROFICIENCY_ICON = {
  none: 'tabler:circle',
  proficient: 'tabler:circle-filled',
  expertise: 'tabler:circle-dot-filled',
} as const;

export const SKILL_PROFICIENCY_TEXT = {
  none: 'Нет владения',
  proficient: 'Владение',
  expertise: 'Компетентность',
} as const;

/* --- Уровни и опыт ------------------------------------------------------ */

export const CHARACTER_LEVEL = { min: 1, max: 20 } as const;

/** Опыт для перехода на уровень: индекс — уровень минус один. */
export const EXPERIENCE_BY_LEVEL = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
] as const;

/** Кости хитов, которые бывают у классов. */
export const HIT_DIE_SIZES = [6, 8, 10, 12] as const;

/** Средний бросок кости хитов при повышении уровня: d8 → 5. */
export const HIT_DIE_AVERAGE_BONUS = 1;

/* --- Заклинания --------------------------------------------------------- */

export const SPELL_LEVEL = { min: 0, max: 9 } as const;

/** Кругов ячеек заклинаний. */
export const SPELL_SLOT_LEVELS = 9;

/**
 * Ячейки заклинаний мультикласса по уровню заклинателя (PHB, гл. 6):
 * индекс — уровень заклинателя минус один, значения — ячейки 1–9 кругов.
 */
export const MULTICLASS_SPELL_SLOTS: ReadonlyArray<ReadonlyArray<number>> = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/**
 * Делитель уровня класса для уровня заклинателя мультикласса по наибольшему
 * кругу ячеек класса на 20 уровне: полный заклинатель (9) — весь уровень,
 * половинный (5) — половина, на треть (4) — треть.
 */
export const CASTER_LEVEL_DIVIDER: Readonly<Record<number, number>> = {
  9: 1,
  5: 2,
  4: 3,
};

/**
 * Колонки таблицы класса с магией договора колдуна: число ячеек и их круг.
 * Обычных ячеек у колдуна нет — они в этих колонках.
 */
export const PACT_MAGIC_COLUMNS = {
  slots: 'Ячейки заклинаний',
  level: 'Уровень ячеек',
} as const;

/** Пустая ячейка в таблице класса. */
export const CLASS_TABLE_EMPTY = '—';

/** Неограниченное значение в колонке таблицы класса. */
export const CLASS_TABLE_UNLIMITED = -1;

export const SPELL_LEVEL_TITLE = 'Заговоры';

/* --- Снаряжение --------------------------------------------------------- */

export const CURRENCY_KEYS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const;

export const CURRENCY_LABELS = {
  cp: 'мм',
  sp: 'см',
  ep: 'эм',
  gp: 'зм',
  pp: 'пм',
} as const;

export const CURRENCY_TITLES = {
  cp: 'Медные монеты',
  sp: 'Серебряные монеты',
  ep: 'Электрумовые монеты',
  gp: 'Золотые монеты',
  pp: 'Платиновые монеты',
} as const;

/** Категории доспехов бэкенда (ArmorCategory). */
export const ARMOR_CATEGORIES = ['LIGHT', 'MEDIUM', 'HEAVY', 'SHIELD'] as const;

export const ARMOR_CATEGORY_LABELS = {
  LIGHT: 'Лёгкий',
  MEDIUM: 'Средний',
  HEAVY: 'Тяжёлый',
  SHIELD: 'Щит',
} as const;

/** Предел модификатора Ловкости в КД по категории доспеха; null — без предела. */
export const ARMOR_DEXTERITY_LIMIT = {
  LIGHT: null,
  MEDIUM: 2,
  HEAVY: 0,
  SHIELD: null,
} as const;

/** КД без доспеха: 10 + модификатор Ловкости. */
export const UNARMORED_ARMOR_CLASS = 10;

/** Конец адреса свойства «Фехтовальное» в ширме. */
export const FINESSE_PROPERTY_URL_SUFFIX = '/finesse';

/** Признак дальнобойного оружия в типе оружия бэкенда (SIMPLE_RANGED…). */
export const RANGED_WEAPON_TYPE_MARKER = 'RANGED';

/** Грузоподъёмность: Сила × 15 фунтов. */
export const CARRYING_CAPACITY_MULTIPLIER = 15;

/* --- Хиты и отдых ------------------------------------------------------- */

export const DEATH_SAVES_MAX = 3;

export const RESOURCE_RESETS = ['SHORT', 'LONG'] as const;

export const RESOURCE_RESET_LABELS = {
  SHORT: 'Короткий отдых',
  LONG: 'Долгий отдых',
} as const;

/* --- Справочники -------------------------------------------------------- */

/** Префикс адресов API справочника: `/api/v1` + адрес записи. */
export const CATALOG_API_PREFIX = '/api/v1';

/** Вкладки нижней части листа. */
export const SHEET_TABS = [
  { value: 'inventory', label: 'Снаряжение', icon: 'tabler:backpack' },
  { value: 'spells', label: 'Заклинания', icon: 'tabler:wand' },
  { value: 'features', label: 'Умения', icon: 'tabler:sparkles' },
  { value: 'personality', label: 'Личность', icon: 'tabler:mood-smile' },
  { value: 'notes', label: 'Заметки', icon: 'tabler:notes' },
] as const;

export const SHEET_LABELS = {
  race: 'Раса',
  background: 'Предыстория',
  classes: 'Классы',
  alignment: 'Мировоззрение',
  experience: 'Опыт',
  nextLevel: 'до след. уровня',
  inspiration: 'Вдохновение',
  armorClass: 'КД',
  armorClassFull: 'Класс доспеха',
  armorClassAuto: 'Считать по снаряжению',
  armorClassManual: 'Своё значение',
  armorClassBonus: 'Бонус к КД',
  initiative: 'Инициатива',
  initiativeBonus: 'Бонус к инициативе',
  speed: 'Скорость',
  speedUnit: 'фт.',
  darkvision: 'Тёмное зрение',
  proficiencyBonus: 'Бонус мастерства',
  passivePerception: 'Пассивная Внимательность',
  hitPoints: 'Хиты',
  hitPointsMax: 'Максимум',
  hitPointsCurrent: 'Текущие',
  hitPointsTemporary: 'Временные',
  damage: 'Урон',
  heal: 'Лечение',
  hitDice: 'Кости хитов',
  deathSaves: 'Спасброски от смерти',
  successes: 'Успехи',
  failures: 'Провалы',
  shortRest: 'Короткий отдых',
  longRest: 'Долгий отдых',
  abilities: 'Характеристики',
  savingThrows: 'Спасброски',
  savingThrow: 'Спасбросок',
  savingThrowShort: 'Спас.',
  attack: 'Атака',
  skills: 'Навыки',
  proficiencies: 'Владения и языки',
  armorProficiency: 'Доспехи',
  weaponProficiency: 'Оружие',
  toolProficiency: 'Инструменты',
  languages: 'Языки',
  attacks: 'Атаки',
  inventory: 'Снаряжение',
  currency: 'Монеты',
  weight: 'Вес',
  weightUnit: 'фнт.',
  carryingCapacity: 'Грузоподъёмность',
  quantity: 'Кол-во',
  equipped: 'Надето',
  addFromCatalog: 'Из справочника',
  addCustom: 'Своё',
  spellcastingAbility: 'Базовая характеристика',
  spellSaveDc: 'Сл спасброска',
  spellAttack: 'Бонус атаки',
  spellSlots: 'Ячейки заклинаний',
  pactSlots: 'Магия договора',
  prepared: 'Подготовлено',
  ritual: 'Ритуал',
  ritualShort: 'Р',
  concentration: 'Концентрация',
  concentrationShort: 'К',
  spellCircle: 'круг',
  noValue: '—',
  damagePlaceholder: '1к8',
  classFeatures: 'Умения классов',
  customFeatures: 'Свои умения и черты',
  resources: 'Ресурсы',
  classTable: 'Таблица класса',
  personalityTraits: 'Черты характера',
  ideals: 'Идеалы',
  bonds: 'Привязанности',
  flaws: 'Слабости',
  appearance: 'Внешность',
  backstory: 'Предыстория персонажа',
  notes: 'Заметки',
  name: 'Имя',
  title: 'Название',
  description: 'Описание',
  source: 'Источник',
  level: 'Уровень',
  archetype: 'Подкласс',
  noArchetype: 'Не выбран',
  hitDie: 'Кость хитов',
  addClass: 'Добавить класс',
  choose: 'Выбрать',
  change: 'Изменить',
  clear: 'Убрать',
  add: 'Добавить',
  save: 'Сохранить',
  close: 'Закрыть',
  remove: 'Удалить',
  search: 'Поиск по справочнику',
  nothingFound: 'Ничего не найдено',
  typeToSearch: 'Начните вводить название',
  notSelected: 'Не выбрана',
  notSelectedClass: 'Не выбран',
  savingThrowsHint: 'Владение спасбросками',
  skillsHint: 'Навыки класса',
  applyRaceBonuses: 'Бонусы расы к характеристикам применены',
  damageDice: 'Урон',
  damageType: 'Тип урона',
  attackBonus: 'Бонус атаки',
  magicBonus: 'Магический бонус',
  proficient: 'Владение',
  finesse: 'Фехтовальное',
  ranged: 'Дальнобойное',
  armorCategory: 'Категория доспеха',
  baseArmorClass: 'Базовый КД',
  stealthDisadvantage: 'Помеха Скрытности',
  strengthRequirement: 'Требуется Сила',
  max: 'Максимум',
  left: 'Осталось',
  used: 'Потрачено',
  reset: 'Восстановление',
  empty: 'Пусто',
  emptyAttacks: 'Добавьте оружие в снаряжение — атаки появятся здесь',
  emptyInventory: 'Снаряжения пока нет',
  emptySpells: 'Заклинаний пока нет',
  emptyFeatures: 'Выберите класс — его умения появятся здесь',
  emptyNotes: 'Заметок пока нет',
  emptyResources: 'Ресурсов пока нет',
  noSpellcasting: 'Нет',
  newNote: 'Новая заметка',
  item: 'Предмет',
  weapon: 'Оружие',
  armor: 'Доспех',
  spell: 'Заклинание',
  school: 'Школа',
  feature: 'Умение',
  resource: 'Ресурс',
  edit: 'Изменить',
} as const;

/** Значки элементов листа. */
export const SHEET_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
  edit: 'tabler:pencil',
  close: 'tabler:x',
  back: 'tabler:arrow-left',
  copy: 'tabler:copy',
  menu: 'tabler:dots-vertical',
  search: 'tabler:search',
  catalog: 'tabler:book-2',
  link: 'tabler:external-link',
  loading: 'tabler:loader-2',
  shield: 'tabler:shield',
  initiative: 'tabler:bolt',
  speed: 'tabler:shoe',
  heart: 'tabler:heart',
  dice: 'tabler:dice-5',
  rest: 'tabler:moon',
  shortRest: 'tabler:coffee',
  inspiration: 'tabler:star',
  inspirationActive: 'tabler:star-filled',
  check: 'tabler:check',
  minus: 'tabler:minus',
  plus: 'tabler:plus',
  equipped: 'tabler:shirt',
  user: 'tabler:user',
  empty: 'tabler:mood-empty',
} as const;
