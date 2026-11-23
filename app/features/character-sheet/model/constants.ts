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

/**
 * Восстановление ресурса: короткий отдых, долгий и «один заряд на коротком,
 * все — на долгом».
 */
export const RESOURCE_RESETS = ['SHORT', 'LONG', 'SHORT_ONE'] as const;

export const RESOURCE_RESET_LABELS = {
  SHORT: 'Короткий отдых',
  LONG: 'Долгий отдых',
  SHORT_ONE: 'Один на коротком, все на долгом',
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

/* --- Механика справочника ----------------------------------------------- */

/**
 * Виды источников механики на листе: кто выдал владения, выборы, ресурсы и
 * эффекты. По виду источник снимается вместе со своим владельцем: умения
 * класса — с классом и его уровнями, особенности расы — с расой.
 */
export const SOURCE_KINDS = [
  'class',
  'subclass',
  'classFeature',
  'option',
  'race',
  'subrace',
  'raceFeature',
  'background',
  'feat',
  'asi',
] as const;

export const SOURCE_KIND_LABELS = {
  class: 'Класс',
  subclass: 'Подкласс',
  classFeature: 'Умение класса',
  option: 'Особенность класса',
  race: 'Раса',
  subrace: 'Разновидность',
  raceFeature: 'Особенность расы',
  background: 'Предыстория',
  feat: 'Черта',
  asi: 'Увеличение характеристик',
} as const;

/** Ключ выбора навыков класса, который бэкенд заполняет сам. */
export const CLASS_SKILLS_CHOICE_KEY = 'class-skills';

/** Ключ выбора навыков мультикласса (PHB, гл. 6). */
export const MULTICLASS_SKILLS_CHOICE_KEY = 'multiclass-skills';

/** Ключ выбора повышения характеристик записи: `ability-bonus:<номер>`. */
export const ABILITY_BONUS_CHOICE_PREFIX = 'ability-bonus:';

/** Разделитель варианта и характеристики в значении выбора повышения черты. */
export const ABILITY_VARIANT_SEPARATOR = ':';

/** Предел характеристики при повышении чертой и умением 5e 2014. */
export const ABILITY_IMPROVEMENT_LIMIT = 20;

/** Сколько очков даёт умение «Увеличение характеристик». */
export const ABILITY_IMPROVEMENT_POINTS = 2;

/**
 * Начало названия умения «Увеличение характеристик»: в старых данных у
 * умения нет флага, его узнают по названию.
 */
export const ABILITY_IMPROVEMENT_FEATURE_NAME = 'увеличение характеристик';

/** Категории оружия бэкенда (WeaponType) и их названия. */
export const WEAPON_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  SIMPLE_MELE: 'Простое рукопашное оружие',
  SIMPLE_RANGED: 'Простое дальнобойное оружие',
  WAR_MELE: 'Воинское рукопашное оружие',
  WAR_RANGED: 'Воинское дальнобойное оружие',
  EXOTIC_MELE: 'Экзотическое рукопашное оружие',
  EXOTIC_RANGED: 'Экзотическое дальнобойное оружие',
};

/**
 * Пары категорий, которые вместе читаются одной группой: «простое
 * рукопашное» и «простое дальнобойное» — это «Простое оружие».
 */
export const WEAPON_CATEGORY_GROUPS: ReadonlyArray<{
  categories: readonly [string, string];
  label: string;
}> = [
  { categories: ['SIMPLE_MELE', 'SIMPLE_RANGED'], label: 'Простое оружие' },
  { categories: ['WAR_MELE', 'WAR_RANGED'], label: 'Воинское оружие' },
  {
    categories: ['EXOTIC_MELE', 'EXOTIC_RANGED'],
    label: 'Экзотическое оружие',
  },
];

/** Категории доспехов бэкенда (ArmorCategory) и названия групп владения. */
export const ARMOR_PROFICIENCY_LABELS: Readonly<Record<string, string>> = {
  LIGHT: 'Лёгкие доспехи',
  MEDIUM: 'Средние доспехи',
  HEAVY: 'Тяжёлые доспехи',
  SHIELD: 'Щиты',
};

/** Языки бэкенда (LanguageType) и их названия. */
export const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  COMMON: 'Общий',
  COMMON_SIGN_LANGUAGE: 'Общий язык жестов',
  DRACONIC: 'Драконий',
  DWARVISH: 'Дварфский',
  ELVISH: 'Эльфийский',
  GIANT: 'Великаний',
  GNOMISH: 'Гномий',
  GOBLIN: 'Гоблинский',
  HALFLING: 'Полуросликов',
  ORC: 'Орочий',
  ABYSSAL: 'Бездны',
  Celestial: 'Небесный',
  CELESTIAL: 'Небесный',
  DEEP: 'Глубинная речь',
  DRUIDIC: 'Друидический',
  INFERNAL: 'Инфернальный',
  PRIMORDIAL: 'Первичный',
  SYLVAN: 'Сильван',
  THIEVES: 'Воровской жаргон',
  UNDERCOMMON: 'Подземный',
};

/**
 * Языки, которые предлагает выбор языка без своего списка: стандартные и
 * редкие PHB. Ключи — перечисление бэкенда.
 */
export const LANGUAGE_CHOICE_KEYS = [
  'COMMON',
  'DWARVISH',
  'ELVISH',
  'GIANT',
  'GNOMISH',
  'GOBLIN',
  'HALFLING',
  'ORC',
  'ABYSSAL',
  'Celestial',
  'DRACONIC',
  'DEEP',
  'INFERNAL',
  'PRIMORDIAL',
  'SYLVAN',
  'UNDERCOMMON',
] as const;

/**
 * Типы урона бэкенда (DamageType) — название и ключ словаря эффектов. Старые
 * данные пишут огонь `FAIR`, некротическую энергию `NECTOTIC`, звук `SOUND`;
 * у особых видов («немагический физический») ключа эффектов нет.
 */
export const DAMAGE_TYPE_INFO: Readonly<
  Record<string, { label: string; effectKey: string | null }>
> = {
  FAIR: { label: 'Огонь', effectKey: 'fire' },
  FIRE: { label: 'Огонь', effectKey: 'fire' },
  COLD: { label: 'Холод', effectKey: 'cold' },
  LIGHTNING: { label: 'Электричество', effectKey: 'lightning' },
  POISON: { label: 'Яд', effectKey: 'poison' },
  ACID: { label: 'Кислота', effectKey: 'acid' },
  SOUND: { label: 'Звук', effectKey: 'thunder' },
  THUNDER: { label: 'Звук', effectKey: 'thunder' },
  NECTOTIC: { label: 'Некротическая энергия', effectKey: 'necrotic' },
  NECROTIC: { label: 'Некротическая энергия', effectKey: 'necrotic' },
  PSYCHIC: { label: 'Психическая энергия', effectKey: 'psychic' },
  BLUDGEONING: { label: 'Дробящий', effectKey: 'bludgeoning' },
  PIERCING: { label: 'Колющий', effectKey: 'piercing' },
  SLASHING: { label: 'Рубящий', effectKey: 'slashing' },
  RADIANT: { label: 'Излучение', effectKey: 'radiant' },
  FORCE: { label: 'Силовое поле', effectKey: 'force' },
  PHYSICAL: {
    label: 'Немагический дробящий, колющий и рубящий',
    effectKey: null,
  },
  NO_NOSILVER: {
    label: 'Немагический непосеребрённый физический',
    effectKey: null,
  },
  NO_ADMANTIT: {
    label: 'Немагический неадамантиновый физический',
    effectKey: null,
  },
  PHYSICAL_MAGIC: { label: 'Магический физический', effectKey: null },
  MAGIC: { label: 'Урон от заклинаний', effectKey: null },
};

/** Типы урона, которые предлагает выбор типа урона без своего списка. */
export const DAMAGE_TYPE_CHOICE_KEYS = [
  'ACID',
  'BLUDGEONING',
  'COLD',
  'FAIR',
  'FORCE',
  'LIGHTNING',
  'NECTOTIC',
  'PIERCING',
  'POISON',
  'PSYCHIC',
  'RADIANT',
  'SLASHING',
  'SOUND',
] as const;

/** Состояния бэкенда (Condition) и их названия. */
export const CONDITION_LABELS: Readonly<Record<string, string>> = {
  BLINDED: 'Ослеплённый',
  CHARMED: 'Очарованный',
  DEAFENED: 'Оглохший',
  EXHAUSTION: 'Истощение',
  FRIGHTENED: 'Испуганный',
  GRAPPLED: 'Схваченный',
  INCAPACITATED: 'Недееспособный',
  INVISIBLE: 'Невидимый',
  PARALYZED: 'Парализованный',
  PETRIFIED: 'Окаменевший',
  POISONED: 'Отравленный',
  PRONE: 'Лежащий ничком',
  RESTRAINED: 'Опутанный',
  STUNNED: 'Ошеломлённый',
  UNCONSCIOUS: 'Бессознательный',
  DYING: 'Смерть',
  EVASIONS: 'Уклонение',
};

/** Чувства бэкенда (SenseType) и их названия. */
export const SENSE_LABELS: Readonly<Record<string, string>> = {
  DARKVISION: 'Тёмное зрение',
  BLINDSIGHT: 'Слепое зрение',
  TRUESIGHT: 'Истинное зрение',
  TREMORSENSE: 'Чувство вибрации',
};

/** Ключ чувства «тёмное зрение»: у листа есть своё поле под него. */
export const DARKVISION_SENSE = 'DARKVISION';

/** Чувства бэкенда по ключу чувства в эффектах: `sense.darkvision`. */
export const SENSE_BY_EFFECT_KEY: Readonly<Record<string, string>> = {
  darkvision: 'DARKVISION',
  blindsight: 'BLINDSIGHT',
  truesight: 'TRUESIGHT',
  tremorsense: 'TREMORSENSE',
};

/** Скорости, кроме ходьбы: их дают раса, умения и эффекты. */
export const EXTRA_SPEED_KEYS = ['fly', 'climb', 'swim', 'burrow'] as const;

export const SPEED_LABELS = {
  walk: 'Ходьба',
  fly: 'Полёт',
  climb: 'Лазание',
  swim: 'Плавание',
  burrow: 'Копание',
} as const;

/** Виды выбора на листе. */
export const CHOICE_KINDS = [
  'skill',
  'expertise',
  'language',
  'tool',
  'damageType',
  'spell',
  'cantrip',
  'spellList',
  'spellcastingAbility',
  'savingThrow',
  'ability',
  'abilityBonus',
  'option',
  'feat',
  'weapon',
  'armor',
] as const;

/** Вид выбора по типу выбора бэкенда (ChoiceType). */
export const CHOICE_KIND_BY_API_TYPE = {
  ABILITY: 'ability',
  SAVING_THROW: 'savingThrow',
  SKILL: 'skill',
  TOOL: 'tool',
  LANGUAGE: 'language',
  DAMAGE_TYPE: 'damageType',
  SPELL: 'spell',
  CANTRIP: 'cantrip',
  SPELL_LIST: 'spellList',
  SPELLCASTING_ABILITY: 'spellcastingAbility',
  WEAPON: 'weapon',
  ARMOR: 'armor',
  OPTION: 'option',
  FEAT: 'feat',
} as const;

/** Что даёт выбор навыка у бэкенда: компетентность вместо владения. */
export const CHOICE_GRANT_EXPERTISE = 'EXPERTISE';

export const CHOICE_KIND_LABELS = {
  skill: 'Навыки',
  expertise: 'Компетентность',
  language: 'Языки',
  tool: 'Инструменты',
  damageType: 'Тип урона',
  spell: 'Заклинания',
  cantrip: 'Заговоры',
  spellList: 'Список заклинаний',
  spellcastingAbility: 'Заклинательная характеристика',
  savingThrow: 'Спасбросок',
  ability: 'Характеристика',
  abilityBonus: 'Повышение характеристик',
  option: 'Вариант',
  feat: 'Черта',
  weapon: 'Оружие',
  armor: 'Доспехи',
} as const;

/** Пометки вариантов выбора, которые у персонажа уже есть. */
export const CHOICE_HINTS = {
  proficient: 'владеет',
  expertise: 'компетентен',
  known: 'знает',
  taken: 'уже взято',
  becomesExpertise: 'станет компетентностью',
} as const;

export const CHOICE_TEXT = {
  choose: 'Выбрать',
  chosen: 'Выбрано',
  of: 'из',
  pending: 'Нужно выбрать',
  empty: 'Нет вариантов',
  loading: 'Загрузка вариантов…',
  search: 'Поиск',
  spellSearchHint: 'Начните вводить название заклинания',
  levelRequired: 'с уровня',
  clear: 'Сбросить',
  done: 'Готово',
  title: 'Выборы',
  ownChoices: 'Выборы источника',
} as const;

/** Переменные формулы максимума ресурса и значений эффектов. */
export const FORMULA_TOKENS = {
  proficiency: '@prof',
  level: '@level',
  classLevel: '@classlevel',
  abilityPrefix: '@mod.',
} as const;

/** Сокращения характеристик в формулах: `@mod.dex`. */
export const ABILITY_ABBREVIATIONS = {
  str: 'STRENGTH',
  dex: 'DEXTERITY',
  con: 'CONSTITUTION',
  int: 'INTELLIGENCE',
  wis: 'WISDOM',
  cha: 'CHARISMA',
} as const;

/** Ключ характеристики в словаре эффектов: `ability.strength`. */
export const ABILITY_EFFECT_KEYS = {
  STRENGTH: 'strength',
  DEXTERITY: 'dexterity',
  CONSTITUTION: 'constitution',
  INTELLIGENCE: 'intelligence',
  WISDOM: 'wisdom',
  CHARISMA: 'charisma',
} as const;

/** Ключ навыка в словаре эффектов: `skill.sleightOfHand`. */
export const SKILL_EFFECT_KEYS = {
  ACROBATICS: 'acrobatics',
  ANIMAL_HANDLING: 'animalHandling',
  ARCANA: 'arcana',
  ATHLETICS: 'athletics',
  DECEPTION: 'deception',
  HISTORY: 'history',
  INSIGHT: 'insight',
  INTIMIDATION: 'intimidation',
  INVESTIGATION: 'investigation',
  MEDICINE: 'medicine',
  NATURE: 'nature',
  PERCEPTION: 'perception',
  PERFORMANCE: 'performance',
  PERSUASION: 'persuasion',
  RELIGION: 'religion',
  SLEIGHT_OF_HAND: 'sleightOfHand',
  STEALTH: 'stealth',
  SURVIVAL: 'survival',
} as const;

/** Восстановление ресурса бэкенда (ResourceRecovery) → правило листа. */
export const RESOURCE_RESET_BY_RECOVERY = {
  SHORT_REST: 'SHORT',
  LONG_REST: 'LONG',
  SHORT_REST_ONE: 'SHORT_ONE',
} as const;

/** Сколько возвращает короткий отдых у ресурса «один заряд». */
export const SHORT_REST_ONE_AMOUNT = 1;

/** Режимы правила отдыха бэкенда (CounterRestMode). */
export const COUNTER_REST_MODES = {
  none: 'NONE',
  all: 'ALL',
  amount: 'AMOUNT',
} as const;

/* --- Мультикласс -------------------------------------------------------- */

/** Владения класса, взятого не первым (PHB, гл. 6). */
export interface MulticlassProficiencies {
  armor: ReadonlyArray<string>;
  weapons: ReadonlyArray<string>;
  tools: ReadonlyArray<string>;
  skillCount: number;
}

/** Все категории простого и воинского оружия. */
const SIMPLE_AND_MARTIAL = [
  'SIMPLE_MELE',
  'SIMPLE_RANGED',
  'WAR_MELE',
  'WAR_RANGED',
] as const;

/** Лёгкие и средние доспехи и щиты. */
const LIGHT_MEDIUM_SHIELD = ['LIGHT', 'MEDIUM', 'SHIELD'] as const;

/**
 * Владения, которые даёт класс, взятый не первым (PHB, гл. 6). Ключ — конец
 * адреса класса. Навык на выбор лист предлагает выбором из навыков класса.
 */
export const MULTICLASS_PROFICIENCIES: Readonly<
  Record<string, MulticlassProficiencies>
> = {
  barbarian: {
    armor: ['SHIELD'],
    weapons: SIMPLE_AND_MARTIAL,
    tools: [],
    skillCount: 0,
  },
  bard: { armor: ['LIGHT'], weapons: [], tools: [], skillCount: 1 },
  cleric: { armor: LIGHT_MEDIUM_SHIELD, weapons: [], tools: [], skillCount: 0 },
  druid: { armor: LIGHT_MEDIUM_SHIELD, weapons: [], tools: [], skillCount: 0 },
  fighter: {
    armor: LIGHT_MEDIUM_SHIELD,
    weapons: SIMPLE_AND_MARTIAL,
    tools: [],
    skillCount: 0,
  },
  monk: {
    armor: [],
    weapons: ['SIMPLE_MELE', 'SIMPLE_RANGED'],
    tools: [],
    skillCount: 0,
  },
  paladin: {
    armor: LIGHT_MEDIUM_SHIELD,
    weapons: SIMPLE_AND_MARTIAL,
    tools: [],
    skillCount: 0,
  },
  ranger: {
    armor: LIGHT_MEDIUM_SHIELD,
    weapons: SIMPLE_AND_MARTIAL,
    tools: [],
    skillCount: 1,
  },
  rogue: {
    armor: ['LIGHT'],
    weapons: [],
    tools: ['Воровские инструменты'],
    skillCount: 1,
  },
  sorcerer: { armor: [], weapons: [], tools: [], skillCount: 0 },
  warlock: {
    armor: ['LIGHT'],
    weapons: ['SIMPLE_MELE', 'SIMPLE_RANGED'],
    tools: [],
    skillCount: 0,
  },
  wizard: { armor: [], weapons: [], tools: [], skillCount: 0 },
  artificer: {
    armor: LIGHT_MEDIUM_SHIELD,
    weapons: [],
    tools: ['Воровские инструменты', 'Инструменты ремонтника'],
    skillCount: 0,
  },
};

/* --- Подготовленные заклинания ------------------------------------------ */

/**
 * Классы, готовящие заклинания (PHB 2014): предел — модификатор базовой
 * характеристики плюс уровень класса (`full`) или его половина (`half` — вниз,
 * `halfUp` — вверх, у изобретателя). Ключ — конец адреса класса.
 */
export const PREPARED_CASTER_PROGRESSION: Readonly<
  Record<string, 'full' | 'half' | 'halfUp'>
> = {
  cleric: 'full',
  druid: 'full',
  wizard: 'full',
  paladin: 'half',
  artificer: 'halfUp',
};

/** Колонка таблицы класса с числом известных заклинаний. */
export const KNOWN_SPELLS_COLUMN = 'Известные заклинания';

export const PREPARED_TEXT = {
  limit: 'Подготовлено',
  known: 'Известно',
  override: 'Свой предел',
  auto: 'Считать по классу',
  hint: 'Предел подготовленных заклинаний',
} as const;

/* --- Повышение уровня --------------------------------------------------- */

export const HIT_POINTS_GAIN_MODES = ['average', 'roll', 'max'] as const;

export const HIT_POINTS_GAIN_LABELS = {
  average: 'Среднее',
  roll: 'Бросок',
  max: 'Максимум',
} as const;

export const ABILITY_IMPROVEMENT_MODES = ['abilities', 'feat'] as const;

export const ABILITY_IMPROVEMENT_LABELS = {
  abilities: 'Повысить характеристики',
  feat: 'Взять черту',
  points: 'Распределите 2 очка (не выше 20)',
  featPick: 'Черта',
} as const;

export const LEVEL_UP_TEXT = {
  title: 'Повышение уровня',
  classTitle: 'Новый класс',
  levelUp: 'Повысить уровень',
  levelDown: 'Понизить уровень',
  removeLevelTitle: 'Понизить уровень?',
  removeLevelDescription:
    'Умения, ресурсы, черты и хиты, полученные на этом уровне, будут сняты.',
  removeClassTitle: 'Убрать класс?',
  removeClassDescription:
    'Владения, умения, ресурсы и хиты, полученные от класса, будут сняты.',
  addClass: 'Взять класс',
  pickClass: 'Класс',
  multiclassNote:
    'Класс взят не первым: владения выдаются по таблице мультиклассирования PHB.',
  targetLevel: 'До уровня класса',
  hitPoints: 'Хиты за уровень',
  hitPointsFirst: 'Первый уровень персонажа: максимум кости',
  subclass: 'Подкласс',
  features: 'Умения уровня',
  noFeatures: 'Новых умений на этом уровне нет',
  abilityImprovement: 'Увеличение характеристик',
  back: 'Назад',
  next: 'Далее',
  apply: 'Применить',
  cancel: 'Отмена',
  pendingChoices: 'Остались несделанные выборы — их можно сделать позже',
  loading: 'Загрузка класса…',
  loadFailed: 'Не удалось загрузить класс',
  syncFeatures: 'Подтянуть умения из справочника',
  syncHint:
    'Лист создан до механики: у класса нет умений с выборами и эффектами.',
  rollDie: 'Бросить',
  step: 'Уровень',
  proficiencies: 'Владения класса',
  choices: 'Выборы',
} as const;

/* --- Отдых -------------------------------------------------------------- */

export const REST_TEXT = {
  shortTitle: 'Короткий отдых',
  longTitle: 'Долгий отдых',
  spendHitDice: 'Потратить кости хитов',
  restores: 'Восстановится',
  pactSlots: 'Ячейки магии договора',
  spellSlots: 'Все ячейки заклинаний',
  hitPointsFull: 'Все хиты',
  hitDiceHalf: 'Половина костей хитов',
  resources: 'Ресурсы',
  charges: 'Заряды предметов',
  exhaustion: 'Истощение уменьшится на 1',
  apply: 'Отдохнуть',
  dawn: 'Наступил рассвет',
} as const;

/** Восстановление зарядов магического предмета бэкенда (MagicItemRechargeEvent). */
export const RECHARGE_EVENT_LABELS: Readonly<Record<string, string>> = {
  DAWN: 'На рассвете',
  SHORT_REST: 'После короткого отдыха',
  LONG_REST: 'После долгого отдыха',
};

/** События восстановления зарядов, которые наступают с отдыхом. */
export const RECHARGE_EVENTS = {
  dawn: 'DAWN',
  short: 'SHORT_REST',
  long: 'LONG_REST',
} as const;

/** Восстановление «все заряды» в формуле предмета. */
export const RECHARGE_ALL = 'все';

/* --- Настройка ---------------------------------------------------------- */

/** Сколько предметов персонаж может держать настроенными (DMG). */
export const ATTUNEMENT_LIMIT = 3;

export const ATTUNEMENT_TEXT = {
  title: 'Настройка',
  attuned: 'Настроен',
  requires: 'Требует настройки',
  limit: 'Настроено предметов',
  overLimit: 'Больше трёх настроенных предметов',
  charges: 'Заряды',
  recharge: 'Восстановление',
} as const;

/* --- Защиты и чувства --------------------------------------------------- */

export const DEFENCE_LABELS = {
  title: 'Защиты и чувства',
  resistances: 'Сопротивления',
  immunities: 'Иммунитеты',
  vulnerabilities: 'Уязвимости',
  conditionImmunities: 'Иммунитет к состояниям',
  senses: 'Чувства',
  speeds: 'Скорости',
  empty: 'Особых защит и чувств нет',
  telepathy: 'Телепатия',
  manual: 'Свои скорости',
} as const;

/** Вид защиты от урона бэкенда (DamageDefenseKind). */
export const DAMAGE_DEFENCE_KINDS = {
  RESISTANCE: 'resistances',
  IMMUNITY: 'immunities',
  VULNERABILITY: 'vulnerabilities',
} as const;

/* --- Эффекты ------------------------------------------------------------ */

export const EFFECTS_TEXT = {
  tab: 'Эффекты',
  own: 'Свои эффекты',
  addOwn: 'Новый эффект',
  conditions: 'Состояния',
  exhaustion: 'Истощение',
  exhaustionNone: 'Нет истощения',
  features: 'Эффекты умений и черт',
  items: 'Эффекты снаряжения',
  emptyOwn: 'Своих эффектов пока нет',
  emptyFeatures: 'Умения и черты эффектов не дают',
  emptyItems: 'Надетое снаряжение эффектов не даёт',
  disable: 'Выключить',
  enable: 'Включить',
  remove: 'Удалить',
  edit: 'Изменить',
  save: 'Сохранить',
  close: 'Закрыть',
  autoFail: 'автопровал',
  death: 'Смерть от истощения',
} as const;

/** Ключи изменений эффектов, которые лист считает. */
export const EFFECT_KEYS = {
  armorClass: 'armorClass',
  initiative: 'initiative',
  proficiencyBonus: 'proficiencyBonus',
  spellSaveDc: 'spellSaveDC',
  spellAttack: 'attack.spell',
  meleeAttack: 'attack.melee',
  rangedAttack: 'attack.ranged',
  hitPointsMax: 'hitPoints.max',
  abilityPrefix: 'ability.',
  savePrefix: 'save.',
  skillPrefix: 'skill.',
  movementPrefix: 'movement.',
  sensePrefix: 'sense.',
} as const;

/** Флаг эффектов: скорость равна нулю (Схваченный, Опутанный). */
export const SPEED_ZERO_FLAG = 'speed.zero';

/** Флаг помехи Скрытности: его же даёт шумный доспех. */
export const STEALTH_DISADVANTAGE_FLAG = 'skill.stealth.disadvantage';

/** Приоритет изменения эффекта по умолчанию. */
export const EFFECT_DEFAULT_PRIORITY = 20;
