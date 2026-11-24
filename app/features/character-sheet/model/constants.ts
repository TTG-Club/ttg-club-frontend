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

/** Ключ браузерного хранилища с запертыми листами. */
export const SHEET_LOCKED_STORAGE_KEY = 'ttg-character-sheet-locked';

export const SHEET_TEXT = {
  title: 'Лист персонажа',
  lockedTitle: 'Лист заперт',
  lockedDescription: 'Чтобы править лист, отоприте его замком в шапке.',
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
  half: 0.5,
  proficient: 1,
  expertise: 2,
} as const;

/** Порядок переключения владения навыком по клику. */
export const SKILL_PROFICIENCY_CYCLE = [
  'none',
  'half',
  'proficient',
  'expertise',
] as const;

export const SKILL_PROFICIENCY_ICON = {
  none: 'tabler:circle',
  half: 'tabler:circle-half-2',
  proficient: 'tabler:circle-filled',
  expertise: 'tabler:square-rounded-chevrons-up',
} as const;

export const SKILL_PROFICIENCY_TEXT = {
  none: 'Нет владения',
  half: 'Половина бонуса мастерства',
  proficient: 'Владение',
  expertise: 'Компетентность (двойной бонус)',
} as const;

export const SHEET_SKILL_SETTINGS_LABELS = {
  title: 'Настройка навыков',
  open: 'Настроить навыки',
  hint: 'Характеристика задаёт модификатор навыка, к нему добавляется бонус мастерства по уровню владения (значок: нет, половина, владение, компетентность). Дополнительные бонусы складываются сверху — их сколько угодно.',
  abilityPlaceholder: 'Характеристика',
  proficiency: 'Владение навыком',
  resetSkill: 'Вернуть навык к правилам',
  addBonus: 'Добавить бонус',
  passive: 'Пассивное',
  customTitle: 'Свой навык',
  customHint:
    'Навыка нет в правилах: он встанет в общий список по алфавиту наравне с остальными.',
  customNamePlaceholder: 'Название навыка',
  customAdd: 'Добавить навык',
  customRemove: 'Удалить свой навык',
  customBadge: 'Свой',
  customDuplicate: 'Навык с таким названием уже есть',
  customLimit: 'Своих навыков не больше',
  groupTitle: 'Группировать по характеристикам',
  groupHint: 'Навыки встанут под своими характеристиками, а не одним списком.',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/**
 * Виды своих бонусов к значению характеристики: модификатор характеристики
 * слагаемым к значению не бывает — пара таких бонусов завела бы подсчёт по
 * кругу.
 */
export const ABILITY_BONUS_KINDS = ['flat', 'proficiency', 'level'] as const;

/** Подписи окна характеристики. */
export const ABILITY_SETTINGS_TEXT = {
  open: 'Настроить характеристику',
  description:
    'Укажите значение характеристики — модификатор рассчитается автоматически',
  scoreTitle: 'Значение',
  modifierTitle: 'Модификатор',
  /** Записанное значение в разборе: «Записано 16 · Пояс силы +2». */
  breakdownScore: 'Записано',
  bonusesTitle: 'Бонусы к значению',
  bonusesHint:
    'Бонус поднимает саму характеристику, поэтому вместе с ней растут её модификатор, спасброски, навыки, класс доспеха и атаки.',
  totalTitle: 'Итог',
  save: 'Сохранить',
  cancel: 'Отмена',
} as const;

/** Подписи окна настройки спасбросков. */
export const SAVING_THROW_SETTINGS_TEXT = {
  title: 'Настройка спасбросков',
  open: 'Настроить спасброски',
  hint: 'Характеристика задаёт модификатор спасброска, при владении к нему добавляется бонус мастерства. Дополнительные бонусы складываются сверху — их сколько угодно.',
  abilityPlaceholder: 'Характеристика',
  proficiency: 'Владение спасброском',
  proficient: 'Владение',
  notProficient: 'Нет владения',
  resetSavingThrow: 'Вернуть спасбросок к правилам',
  addBonus: 'Добавить бонус',
  commonTitle: 'Ко всем спасброскам',
  commonHint:
    'Бонус идёт в каждый из шести спасбросков: так заводят плащ защиты или ауру паладина, а не повторяют одно и то же шесть раз.',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Подпись слагаемого навыка от эффектов листа. */
export const SKILL_BONUS_EFFECTS_LABEL = 'Эффекты';

/** Максимальная длина названия своего навыка. */
export const CUSTOM_SKILL_NAME_MAX_LENGTH = 40;

/** Сколько своих навыков можно завести. */
export const CUSTOM_SKILLS_MAX = 10;

/** Характеристика нового своего навыка. */
export const DEFAULT_CUSTOM_SKILL_ABILITY = 'INTELLIGENCE';

/** Пределы своего числа в дополнительном бонусе. */
export const CUSTOM_BONUS_RANGE = { min: -10, max: 10 } as const;

/** Максимальная длина подписи дополнительного бонуса. */
export const CUSTOM_BONUS_LABEL_MAX_LENGTH = 40;

/** Виды дополнительного бонуса: число, модификатор, мастерство, уровни. */
export const CUSTOM_BONUS_KINDS = [
  'flat',
  'ability',
  'proficiency',
  'level',
  'classLevel',
] as const;

/** Знак у плюса в поле бонуса: поле читается бонусом, а не количеством. */
export const CUSTOM_BONUS_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  signDisplay: 'exceptZero',
};

/** Источники бонуса в выпадающем списке; уровни классов добавляет лист. */
export const CUSTOM_BONUS_SOURCE = {
  flat: 'flat',
  proficiency: 'proficiency',
  level: 'level',
  /** Префикс источника «уровень класса»: за ним идентификатор класса листа. */
  classPrefix: 'class:',
} as const;

export const CUSTOM_BONUS_TEXT = {
  flat: 'Своё число',
  abilityPrefix: 'Модификатор',
  proficiency: 'Бонус мастерства',
  level: 'Уровень персонажа',
  classLevel: 'Уровень класса',
  labelPlaceholder: 'Откуда бонус',
  sourcePlaceholder: 'Источник',
  remove: 'Удалить бонус',
  add: 'Добавить бонус',
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

/** Адрес свойства «Тяжёлое» в ответе API оканчивается на это. */
export const HEAVY_PROPERTY_URL_SUFFIX = '/heavy';

/** Адрес свойства «Универсальное»: кость двуручного хвата в `twoHandDice`. */
export const VERSATILE_PROPERTY_URL_SUFFIX = '/versatile';

/** Признак воинского оружия в типе оружия бэкенда (WAR_MELE…). */
export const MARTIAL_WEAPON_TYPE_MARKER = 'WAR';

/** Признак дальнобойного оружия в типе оружия бэкенда (SIMPLE_RANGED…). */
export const RANGED_WEAPON_TYPE_MARKER = 'RANGED';

/** Грузоподъёмность: Сила × 15 фунтов. */
export const CARRYING_CAPACITY_MULTIPLIER = 15;

/** Монет на фунт веса (PHB): 50 монет весят фунт. */
export const COINS_PER_POUND = 50;

/** Множитель грузоподъёмности по размеру (PHB 2014). */
export const CARRYING_SIZE_MULTIPLIER = {
  TINY: 0.5,
  SMALL: 1,
  MEDIUM: 1,
  LARGE: 2,
  HUGE: 4,
  GARGANTUAN: 8,
} as const;

/** Вариант «Нагрузка»: множители Силы для ступеней нагрузки. */
export const ENCUMBRANCE_MULTIPLIER = { encumbered: 5, heavy: 10 } as const;

/** Вариант «Нагрузка»: насколько ступень снижает скорость, фт. */
export const ENCUMBRANCE_SPEED_PENALTY = { encumbered: 10, heavy: 20 } as const;

/** Снижение скорости в доспехе, которому не хватает Силы, фт. */
export const ARMOR_STRENGTH_SPEED_PENALTY = 10;

/** Размеры, которым тяжёлое оружие даёт помеху к атаке. */
export const HEAVY_WEAPON_HINDERED_SIZES: ReadonlyArray<string> = [
  'TINY',
  'SMALL',
];

/** Характеристики, броски которых затрудняет сильная нагрузка. */
export const HEAVY_ENCUMBRANCE_ABILITIES = [
  'strength',
  'dexterity',
  'constitution',
] as const;

/* --- Хиты и отдых ------------------------------------------------------- */

export const DEATH_SAVES_MAX = 3;

/**
 * Быстрые шаги хитов: урон — отрицательный шаг, лечение — положительный.
 * Общие для быстрого окна хитов и полной настройки здоровья.
 */
export const HIT_POINT_STEP_BUTTONS = [
  { step: -5, label: '−5', color: 'error' },
  { step: -1, label: '−1', color: 'error' },
  { step: 1, label: '+1', color: 'success' },
  { step: 5, label: '+5', color: 'success' },
] as const;

/** Ввод хитов: `20` — точное значение, `+3` и `-7` — сдвиг от текущих. */
export const HIT_POINTS_INPUT_PATTERN = /^([+\-−])?\s*(\d+)$/;

/** Пределы числа дополнительных костей хитов одной строки. */
export const EXTRA_HIT_DICE_COUNT = { min: 1, max: 20 } as const;

/** Подписи окон хитов. */
export const HEALTH_TEXT = {
  quickTitle: 'Хиты',
  expression: 'Точное значение, + или −',
  expressionPlaceholder: 'напр. −7, +3 или 20',
  expressionAria: 'Новое значение хитов или сдвиг',
  expressionApply: 'OK',
  done: 'Готово',
  quickSteps: 'Текущие',
  quickStep: 'Изменить текущие хиты на',
  maxTotal: 'С прибавками',
  suggestedMax: 'Среднее по классам',
  classDice: 'Кости хитов классов',
  classDiceEmpty: 'Кости хитов появятся вместе с классом',
  extraDice: 'Дополнительные кости хитов',
  extraDiceHint:
    'Кости не от уровней класса: тратятся и возвращаются вместе с костями того же размера.',
  extraDiceName: 'Откуда',
  extraDiceNamePlaceholder: 'Черта, предмет…',
  extraDiceCount: 'Сколько',
  extraDiceDie: 'Кость',
  extraDiceAdd: 'Добавить кость',
  remaining: 'Осталось',
  spendDie: 'Потратить кость',
  restoreDie: 'Вернуть кость',
  dyingHint: 'При 0 хитов персонаж без сознания и делает спасброски от смерти.',
} as const;

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

/** Источники максимума своего ресурса. */
export const RESOURCE_MAX_SOURCES = [
  'fixed',
  'proficiency',
  'ability',
  'level',
] as const;

export const RESOURCE_MAX_SOURCE_LABELS = {
  fixed: 'Своё число',
  proficiency: 'Бонус мастерства',
  ability: 'Модификатор характеристики',
  level: 'Уровень персонажа',
} as const;

/** Пределы прибавки к источнику максимума ресурса. */
export const RESOURCE_MAX_OFFSET_RANGE = { min: -9, max: 9 } as const;

/** Подписи настройки максимума ресурса. */
export const RESOURCE_MAX_TEXT = {
  source: 'Максимум от',
  ability: 'Характеристика',
  offset: 'Прибавка',
  minimum: 'Не меньше',
  computed: 'Сейчас',
  catalogHint:
    'Максимум ресурса из справочника растёт вместе с персонажем сам.',
} as const;

/* --- Справочники -------------------------------------------------------- */

/** Префикс адресов API справочника: `/api/v1` + адрес записи. */
export const CATALOG_API_PREFIX = '/api/v1';

/** Вкладки нижней части листа. */
export const SHEET_TABS = [
  { value: 'inventory', label: 'Снаряжение' },
  { value: 'spells', label: 'Заклинания' },
  { value: 'features', label: 'Особенности' },
  { value: 'effects', label: 'Эффекты' },
  { value: 'personality', label: 'Личность' },
  { value: 'notes', label: 'Заметки' },
] as const;

/**
 * Вкладка «Основное»: на узком листе (меньше `SHEET_WIDE_MIN_WIDTH`) в ней
 * живёт сводка — плитки, здоровье, навыки, спасброски; стоит первой.
 */
export const SHEET_MAIN_TAB = { value: 'main', label: 'Основное' } as const;

/** Вкладка широкого листа по умолчанию. */
export const SHEET_DEFAULT_TAB = SHEET_TABS[0].value;

/**
 * Свайп по содержимому вкладки листает разделы (как на new.ttg.club), px:
 * - `threshold` — путь пальца, после которого раздел переключается;
 * - `deadzone` — пока палец ближе, раздел стоит на месте;
 * - `axisLock` — путь, на котором выбирается ось жеста: браузер решает о
 *   прокрутке на первых пикселях, и после этого жест уже не отменить;
 * - `resistance` — у края ленты раздел отходит лишь на долю пути пальца;
 * - `fadeSpan` — доля ширины, на которой затухание доходит до предела;
 * - `maxFade` — предел затухания (1 — до полной прозрачности);
 * - `overflowEpsilon` — запас при проверке горизонтальной прокрутки блока.
 */
export const SHEET_TABS_SWIPE = {
  threshold: 60,
  deadzone: 8,
  axisLock: 4,
  resistance: 0.25,
  fadeSpan: 0.5,
  maxFade: 0.7,
  overflowEpsilon: 1,
} as const;

/** Удержание, после которого открывается правка (сенсорные экраны), мс. */
export const LONG_PRESS_DELAY = 500;

/** Прокрутка ленты вкладок: запас у края и доля ширины на шаг стрелки. */
export const SHEET_TABS_SCROLL = { epsilon: 1, stepRatio: 0.6 } as const;

export const SHEET_TABS_SCROLL_LABELS = {
  left: 'Прокрутить вкладки влево',
  right: 'Прокрутить вкладки вправо',
} as const;

/** Ширина листа, с которой вкладки стоят справа от сводки, px. */
export const SHEET_WIDE_MIN_WIDTH = 1024;

/** Зазор между рядом характеристик и вкладками, px. */
export const SHEET_RIGHT_COLUMN_GAP = 16;

export const REMOVE_CONFIRM_TEXT = {
  title: 'Удалить?',
  unnamed: 'Без названия',
  /**
   * Описание окна подтверждения.
   * @param name - название записи
   */
  description: (name: string): string => `«${name}» будет удалено из листа.`,
} as const;

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

/* --- Особенности -------------------------------------------------------- */

/** Виды источника особенности: бейдж строки и чип отбора. */
export const FEATURE_ORIGINS = [
  'race',
  'class',
  'background',
  'feat',
  'custom',
] as const;

/** Подписи источников особенностей. */
export const FEATURE_ORIGIN_LABELS: Record<
  (typeof FEATURE_ORIGINS)[number],
  { label: string; hint: string }
> = {
  race: { label: 'Раса', hint: 'Особенности расы и разновидности' },
  class: { label: 'Класс', hint: 'Умения классов и подклассов' },
  background: { label: 'Предыстория', hint: 'Умение предыстории' },
  feat: { label: 'Черта', hint: 'Черты и увеличения характеристик' },
  custom: { label: 'Своё', hint: 'Особенности, добавленные вручную' },
};

/** Цвет бейджа источника особенности. */
export const FEATURE_ORIGIN_COLORS = {
  race: 'success',
  class: 'primary',
  background: 'warning',
  feat: 'secondary',
  custom: 'neutral',
} as const;

/** Подписи вкладки особенностей. */
export const FEATURES_TEXT = {
  add: 'Добавить',
  addFeature: 'Особенность',
  addFeat: 'Черта',
  reset: 'Сбросить',
  resetHint: 'Показать все особенности',
  empty: 'Особенностей пока нет',
  emptyFilter: 'Под отбор ничего не подошло',
  source: 'Источник',
  choice: 'Выбор',
  noDescription: 'Описание не заполнено',
  edit: 'Изменить',
  remove: 'Убрать',
  pending: 'Не сделано выборов',
  increases: 'Увеличения',
  open: 'Открыть в справочнике',
  classTable: 'Таблица класса',
  loading: 'Загружаем умения классов…',
} as const;

/** Подписи окна своей особенности. */
export const FEATURE_FORM_TEXT = {
  createTitle: 'Своя особенность',
  editTitle: 'Изменить особенность',
  name: 'Название',
  origin: 'Источник',
  source: 'Название источника',
  sourcePlaceholder: 'Например, «Эльф» или «Воин»',
  choice: 'Выбор',
  choicePlaceholder: 'Например, «Боевой стиль: защита»',
  description: 'Описание',
  save: 'Сохранить',
  add: 'Добавить',
  cancel: 'Отмена',
} as const;

/** Подписи окна выбора черт. */
export const FEAT_ADD_TEXT = {
  title: 'Черты',
  search: 'Поиск по названию',
  taken: 'Уже взята',
  repeatable: 'Можно брать несколько раз',
  preview: 'Открыть описание',
  select: 'Выбрать',
  add: 'Добавить',
  next: 'Далее',
  back: 'Назад',
  cancel: 'Отмена',
  clear: 'Снять выбор',
  empty: 'Ничего не найдено',
  error: 'Не удалось загрузить черты',
  retry: 'Повторить',
  addFailed: 'Не удалось добавить черты',
  choicesTitle: 'Выборы черт',
  noChoices: 'У выбранных черт нет выборов',
  done: 'Готово',
  noGroup: 'Прочие',
} as const;

/** Подписи вкладки эффектов. */
export const EFFECTS_TAB_TEXT = {
  filters: {
    applied: {
      label: 'Наложенные',
      hint: 'Состояния и свои эффекты',
    },
    features: {
      label: 'Умения и черты',
      hint: 'Эффекты умений, черт, расы и предыстории',
    },
    items: { label: 'Снаряжение', hint: 'Эффекты надетых предметов' },
  },
  reset: 'Сбросить',
  add: 'Добавить',
  empty: 'Эффектов пока нет',
  emptyFilter: 'Под отбор ничего не подошло',
  noDescription: 'Описания нет',
  condition: 'Состояние',
  own: 'Свой эффект',
  enable: 'Включить',
  disable: 'Выключить',
  edit: 'Изменить',
  remove: 'Убрать',
  conditions: 'Состояния',
} as const;

/** Виды источника эффекта для отбора. */
export const EFFECT_FILTER_KEYS = ['applied', 'features', 'items'] as const;

/** Подписи вкладки личности. */
export const PERSONALITY_TEXT = {
  traitsTitle: 'Приметы',
  editTraits: 'Изменить приметы',
  backgroundTitle: 'Предыстория',
  noBackground: 'Предыстория не выбрана',
  chooseBackground: 'Выбрать',
  openBackground: 'Открыть в справочнике',
  empty: 'Не заполнено',
  add: 'Добавить',
  edit: 'Изменить',
  modalTitle: 'Приметы',
  reset: 'Сбросить',
  apply: 'Применить',
  cancel: 'Отмена',
  save: 'Сохранить',
  alignmentPlaceholder: 'Выберите или впишите',
} as const;

/** Краткие приметы персонажа: поле, подпись и подсказка. */
export const PERSONALITY_TRAIT_FIELDS = [
  { key: 'age', label: 'Возраст', placeholder: '25 лет' },
  { key: 'height', label: 'Рост', placeholder: '180 см' },
  { key: 'weight', label: 'Вес', placeholder: '75 кг' },
  { key: 'eyes', label: 'Глаза', placeholder: 'Карие' },
  { key: 'hair', label: 'Волосы', placeholder: 'Тёмные' },
  { key: 'skin', label: 'Кожа', placeholder: 'Смуглая' },
] as const;

/** Плитка приметы: подпись и значение в две строки. */
export const PERSONALITY_TILE_CLASS =
  'flex min-w-0 cursor-pointer flex-col items-start gap-0.5 rounded-lg border border-default/50 bg-elevated/20 px-3 py-2 text-left transition-colors hover:border-primary/60';

/** Длина краткой приметы. */
export const PERSONALITY_TRAIT_MAX_LENGTH = 40;

/** Тексты личности в разметке: черты характера 2014 и описания. */
export const PERSONALITY_TEXT_FIELDS = [
  { key: 'traits', label: 'Черты характера', isWide: false },
  { key: 'ideals', label: 'Идеалы', isWide: false },
  { key: 'bonds', label: 'Привязанности', isWide: false },
  { key: 'flaws', label: 'Слабости', isWide: false },
  { key: 'appearance', label: 'Внешность и описание', isWide: true },
  { key: 'backstory', label: 'История персонажа', isWide: true },
] as const;

/** Мировоззрения PHB 2014. */
export const ALIGNMENTS = [
  'Законно-добрый',
  'Нейтрально-добрый',
  'Хаотично-добрый',
  'Законно-нейтральный',
  'Нейтральный',
  'Хаотично-нейтральный',
  'Законно-злой',
  'Нейтрально-злой',
  'Хаотично-злой',
  'Без мировоззрения',
] as const;

/** Подписи заметок. */
export const NOTE_TEXT = {
  add: 'Добавить заметку',
  createTitle: 'Новая заметка',
  editTitle: 'Изменить заметку',
  title: 'Название',
  titlePlaceholder: 'Например, «Задания»',
  text: 'Текст',
  textPlaceholder: 'Что нужно запомнить',
  untitled: 'Без названия',
  save: 'Сохранить',
  cancel: 'Отмена',
  edit: 'Изменить',
  remove: 'Убрать',
  empty: 'Заметок пока нет',
} as const;

/**
 * Кнопки действий строки: на широком экране проявляются по наведению или
 * фокусу, на узком видны всегда.
 */
export const SHEET_ROW_ACTIONS_CLASS =
  'transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100';
/**
 * Отделяет уровень повтора от умения в идентификаторе: `c12~8` — умение
 * `c12`, повторённое на 8 уровне (рост по уровням).
 */
export const CLASS_FEATURE_SCALING_SEPARATOR = '~';

/** Тип выбора бэкенда для особенностей класса (вариантов умения). */
export const CHOICE_TYPE_OPTION = 'OPTION';

/** Ключ выбора из вариантов умения: префикс и идентификатор умения. */
export const FEATURE_OPTIONS_CHOICE_PREFIX = 'featureOptions:';

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

/** Все виды передвижения в порядке окна настройки. */
export const SPEED_KEYS = ['walk', ...EXTRA_SPEED_KEYS] as const;

/** Единицы расстояний листа: хранятся футы, показываются выбранные. */
export const SPEED_UNITS = ['feet', 'meters'] as const;

/** Метров в футе по соглашению правил: 5 фт = 1,5 м. */
export const METERS_PER_FOOT = 0.3;

export const SPEED_UNIT_SHORT_LABELS = {
  feet: 'фт.',
  meters: 'м',
} as const;

export const SPEED_UNIT_OPTIONS = [
  { value: 'feet', label: 'Футы (фт.)' },
  { value: 'meters', label: 'Метры (м)' },
] as const;

/** Шаг поля скорости в единицах листа: клетка 5 фт = 1,5 м. */
export const SPEED_INPUT_STEP = { feet: 5, meters: 1.5 } as const;

/** Пределы скорости и бонуса к ней, фт. */
export const SPEED_RANGE = { min: 0, max: 1000 } as const;
export const SPEED_BONUS_RANGE = { min: -120, max: 120 } as const;

/**
 * Виды бонуса к скорости — только своё число: скорость меряется расстоянием,
 * а не очками броска, и модификатор или уровень в футах смысла не имеют.
 */
export const SPEED_BONUS_KINDS = ['flat'] as const;

/** Характеристика атаки обычным оружием по правилам. */
export const DEFAULT_WEAPON_ATTACK_ABILITY = 'STRENGTH';

/** Характеристика инициативы по правилам. */
export const DEFAULT_INITIATIVE_ABILITY = 'DEXTERITY';

/** Значение пункта «по правилам» в списке характеристики атаки. */
export const WEAPON_ATTACK_ABILITY_AUTO = 'auto';

/**
 * Виды своих бонусов к бонусу мастерства: сам себе слагаемым он не бывает.
 */
export const PROFICIENCY_BONUS_KINDS = [
  'flat',
  'ability',
  'level',
  'classLevel',
] as const;

/** Источники основы: по правилам или своё число. */
export const SETTINGS_BASE_SOURCE = {
  level: 'level',
  flat: 'flat',
} as const;

/** Вкладки окна настроек листа. */
export const SHEET_SETTINGS_TABS = [
  { label: 'Атака оружием', value: 'weapon', slot: 'weapon' },
  { label: 'Свои бонусы', value: 'bonuses', slot: 'bonuses' },
] as const;

/** Подписи окна настроек листа. */
export const SHEET_SETTINGS_TEXT = {
  title: 'Настройки листа',
  open: 'Настройки листа',
  weaponAbilityTitle: 'Базовая характеристика',
  weaponAbilityAuto: 'По правилам',
  weaponAbilityAutoHint: 'По правилам: Сила',
  normalWeaponTitle: 'Обычное оружие',
  finesseWeaponTitle: 'Фехтовальное и дальнобойное',
  abilityModifierTitle: 'Модификатор характеристики',
  proficiencyBonusTitle: 'Бонус мастерства',
  attackFormulaHint:
    'Бонус атаки = бонус мастерства + модификатор характеристики. Дальнобойное оружие бьёт от Ловкости, фехтовальное — от лучшей из Ловкости и базовой характеристики.',
  initiativeTitle: 'Инициатива',
  baseEditTitle: 'Настроить основу',
  baseSourceTitle: 'Источник',
  baseValueTitle: 'Значение',
  levelBase: 'По уровню',
  flatBase: 'Своё число',
  customBonusesTitle: 'Свои бонусы',
  totalTitle: 'Итог',
  totalProficiencyBonusTitle: 'Итоговый бонус мастерства',
  totalInitiativeTitle: 'Итоговая инициатива',
  proficiencyHint:
    'Идёт в спасброски, навыки, атаку оружием и заклинательство.',
  initiativeHint: 'Показывается в плитке инициативы и в её броске.',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Подписи окна набора характеристик (калькулятор в листе). */
export const ABILITY_SCORES_TEXT = {
  menu: 'Калькулятор характеристик',
  title: 'Набор характеристик',
  description:
    'Соберите значения как в калькуляторе характеристик и запишите их в лист',
  current: 'Сейчас в листе',
  incompleteHint: 'Назначьте значения всем шести характеристикам',
  bonusesHint:
    'Прибавки расы, черт и повышений уже входят в значения листа, поэтому они добавляются к набору сами:',
  replaceHint: 'Набор заменит записанные значения характеристик.',
  apply: 'Записать в лист',
  cancel: 'Отмена',
} as const;

/** Подписи окна передвижения. */
export const SPEED_SETTINGS_TEXT = {
  title: 'Передвижение',
  hint: 'Своё значение — скорость по расе и классу. Бонусы складываются с итогом: их дают умения, предметы и заклинания. Скорость от расы и эффектов лист считает сам.',
  unitTitle: 'Единицы',
  hover: 'Парение',
  hoverShort: 'парение',
  addBonus: 'Добавить бонус',
  ownValue: 'Своё значение',
  total: 'Итог с бонусами',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Подписи окна класса доспеха. */
export const ARMOR_CLASS_TEXT = {
  title: 'Класс доспеха',
  customToggle: 'Своё значение',
  customToggleHint:
    'Основа КД задаётся вручную, а не по надетому доспеху: так считают естественный доспех или КД из другого источника.',
  valueTitle: 'Основа',
  abilitiesTitle: 'Характеристики',
  abilitiesPlaceholder: 'Не добавлять',
  abilitiesArmorHint:
    'Ловкость идёт в КД по правилу доспеха, остальные характеристики прибавляются целиком (защита без доспехов).',
  abilitiesArmorEmptyHint:
    'Модификаторы характеристик в КД не идут: только доспех, щит и бонусы.',
  abilitiesCustomHint:
    'Модификаторы выбранных характеристик прибавляются к основе целиком.',
  abilitiesCustomEmptyHint: 'К основе ничего не прибавляется.',
  dexLimitTitle: 'Предел Ловкости',
  dexLimitRule: 'По правилу доспеха',
  bonusTitle: 'Свой бонус',
  armorTitle: 'Доспех',
  unarmored: 'Без доспеха',
  dexCapped: 'Ловкость ограничена доспехом',
  shieldTitle: 'Щит',
  featuresTitle: 'Умения и черты',
  effectsTitle: 'Эффекты',
  totalTitle: 'Итог',
  equipmentHint:
    'КД пересчитывается сам, когда вы надеваете или снимаете доспех и щит в снаряжении.',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Предел Ловкости, который можно задать вручную. */
export const ARMOR_DEX_LIMIT_MAX = 5;

/** Характеристики КД по умолчанию: Ловкость по правилу доспеха. */
export const DEFAULT_ARMOR_CLASS_ABILITIES = ['DEXTERITY'] as const;

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

/** Колонка таблицы класса с числом известных заговоров. */
export const KNOWN_CANTRIPS_COLUMN = 'Известные заговоры';

/** Виды счёта заклинаний: круги 1+ и заговоры считаются порознь. */
export const PREPARED_KINDS = ['spells', 'cantrips'] as const;

/** Подписи окна и плиток пределов. */
export const PREPARED_TEXT = {
  limit: 'Подготовлено',
  known: 'Известно',
  cantrips: 'Заговоры',
  override: 'Свой предел',
  auto: 'Считать по классу',
  hint: 'Предел подготовленных заклинаний',
  knownHint: 'Предел известных заклинаний',
  cantripsHint: 'Предел известных заговоров',
  spellsTitle: 'Подготовленные заклинания',
  cantripsTitle: 'Известные заговоры',
  classValue: 'По таблице класса',
  noClassValue: 'Таблица класса предела не задаёт',
  custom: 'Своё число',
  bonus: 'Бонус',
  total: 'Итого',
  apply: 'Применить',
  cancel: 'Отмена',
  over: 'Отмечено больше предела',
} as const;

/** Иконки плиток пределов. */
export const PREPARED_ICON = {
  spells: 'tabler:book',
  cantrips: 'tabler:sparkles',
} as const;

/* --- Вкладка заклинаний ------------------------------------------------- */

/** Уровни персонажа, на которых растёт урон заговора (×2, ×3, ×4). */
export const CANTRIP_SCALING_LEVELS = [5, 11, 17] as const;

/**
 * Виды источников, выдающих заклинания «сверх класса»: вид, черта,
 * предыстория. Их заклинания стоят отдельной группой и в предел не входят.
 */
export const INNATE_SPELL_SOURCE_KINDS: ReadonlyArray<string> = [
  'race',
  'subrace',
  'raceFeature',
  'background',
  'feat',
  'asi',
];

/** Иконка заклинания: квадрат в начале строки, он же переключатель подготовки. */
export const SPELL_ICON = 'tabler:wand';

/** Порядок групп выданных заклинаний перед кругами. */
export const SPELL_GROUP_ORDER = {
  grantedCantrips: -2,
  innate: -1,
} as const;

/** Подписи групп списка заклинаний. */
export const SPELL_GROUP_TEXT = {
  grantedCantrips: 'Выданные заговоры',
  innate: 'Вид, черты и предыстория',
  cantrips: 'Заговоры',
} as const;

/** Подписи шапки и строк вкладки заклинаний. */
export const SPELL_TAB_TEXT = {
  saveDc: { short: 'Сл', full: 'Сл спасброска от заклинаний' },
  attack: { short: 'Атака', full: 'Бонус атаки заклинанием' },
  character: 'Персонаж',
  editSpellcasting: 'Настроить заклинательную характеристику',
  add: 'Добавить',
  addFromCatalog: 'Из справочника',
  addCustom: 'Своё заклинание',
  filterPrepared: 'Подготовленные',
  filterPreparedHint: 'Только подготовленные заклинания',
  filterReset: 'Сбросить',
  filterEmpty: 'Под отбор ничего не подошло',
  empty: 'Заклинаний пока нет',
  slots: 'Ячейки',
  pactSlots: 'Договор',
  prepare: 'Подготовить',
  unprepare: 'Снять подготовку',
  alwaysPrepared: 'Подготовлено всегда',
  grantedCantrip: 'Выданный заговор подготовлен всегда',
  outOfLimit: 'Места среди подготовленных не занимает',
  limitReached: 'Предел подготовленных уже выбран',
  custom: 'Свой',
  customHint: 'Своё заклинание: правится целиком, описание хранится в листе',
  classBadge: 'Класс',
  classBadgeHint: 'Выдано умением класса',
  concentration: 'Концентрация',
  concentrationShort: 'К',
  ritual: 'Ритуал',
  ritualShort: 'Р',
  abilityHint: 'Своя заклинательная характеристика',
  menu: 'Действия заклинания',
  edit: 'Изменить',
  copy: 'Копия в своё',
  ability: 'Характеристика',
  remove: 'Убрать',
  open: 'Открыть заклинание',
  expand: 'Развернуть заклинание',
  emptyDescription: 'Описания нет',
  damage: 'Урон',
  healing: 'Лечение',
  rollHint: 'Нажмите, чтобы бросить',
  castHint: 'Нажмите, чтобы выбрать ячейку и бросить',
  cast: 'Сотворить',
  copyFailed: 'Не удалось загрузить заклинание из справочника',
  copied: 'Своя копия создана',
} as const;

/** Подписи ячеек в разделителях кругов. */
export const SPELL_SLOT_TEXT = {
  summary: (left: number, max: number) => `Осталось ${left} из ${max}`,
  pactSummary: (left: number, max: number) =>
    `Ячейки договора: осталось ${left} из ${max}, возвращаются коротким отдыхом`,
  slot: (level: number, index: number) => `Ячейка ${level} круга №${index}`,
} as const;

/** Характеристики своего заклинания в развёрнутой строке. */
export const SPELL_STAT_KEYS = [
  'castingTime',
  'range',
  'components',
  'duration',
] as const;

/** Подписи характеристик своего заклинания в развёрнутой строке. */
export const SPELL_STAT_LABELS = {
  castingTime: 'Время',
  range: 'Дистанция',
  components: 'Компоненты',
  duration: 'Длительность',
} as const;

/** Подписи окна заклинательной характеристики класса. */
export const SPELLCASTING_TEXT = {
  title: 'Заклинательная характеристика',
  ability: 'Характеристика',
  auto: 'По классу',
  autoValue: (label: string) => `По классу: ${label}`,
  autoMissing: 'По классу: не определена',
  none: 'Нет',
  apply: 'Применить',
  cancel: 'Отмена',
  hint: 'Сл = 8 + бонус мастерства + модификатор, атака = бонус мастерства + модификатор. Эффекты листа добавляются сверху.',
} as const;

/** Подписи окна своей характеристики заклинания. */
export const SPELL_ABILITY_TEXT = {
  title: 'Характеристика заклинания',
  label: 'Характеристика',
  inherit: 'Как у класса',
  hint: 'Нужна заклинаниям черт и видов, которые считаются от своей характеристики («Посвящённый в магию»).',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Подписи окна сотворения (броска урона) заклинания. */
export const SPELL_CAST_TEXT = {
  title: (name: string) => `Сотворение: ${name}`,
  slot: 'Ячейка',
  noSlot: 'Без траты ячейки',
  slotOption: (level: number, left: number) =>
    `${level} круг (осталось ${left})`,
  pactOption: (level: number, left: number) =>
    `Договор, ${level} круг (осталось ${left})`,
  spendOnly: 'Потратить без броска',
  cancel: 'Отмена',
  upcast: (dice: string) => `За каждый круг выше: +${dice}`,
  noSlots: 'Свободных ячеек нужного круга нет',
} as const;

/** Подписи окна своего заклинания. */
export const SPELL_FORM_TEXT = {
  createTitle: 'Своё заклинание',
  editTitle: 'Изменить заклинание',
  tabMain: 'Основное',
  tabDamage: 'Урон',
  name: 'Название',
  level: 'Круг',
  school: 'Школа',
  ritual: 'Ритуал',
  concentration: 'Концентрация',
  castingTime: 'Время накладывания',
  range: 'Дистанция',
  components: 'Компоненты',
  duration: 'Длительность',
  description: 'Описание',
  ability: 'Своя характеристика',
  dice: 'Кости',
  dicePlaceholder: '8к6',
  bonus: 'Бонус',
  abilityModifier: '+ модификатор',
  type: 'Тип урона',
  noType: 'Без типа',
  healing: 'Лечение',
  condition: 'Условие',
  addRoll: 'Добавить бросок',
  removeRoll: 'Убрать бросок',
  cantripScaling: 'Растёт на 5, 11 и 17 уровне персонажа',
  upcastDice: 'За каждый круг выше',
  noRolls: 'Бросков урона нет',
  save: 'Сохранить',
  cancel: 'Отмена',
  invalidDice: 'Кости в виде 8к6',
} as const;

/** Школы магии для своего заклинания. */
export const SPELL_SCHOOLS = [
  'Вызов',
  'Воплощение',
  'Иллюзия',
  'Некромантия',
  'Ограждение',
  'Очарование',
  'Преобразование',
  'Прорицание',
] as const;

/** Наибольшее число бросков у своего заклинания. */
export const SPELL_DAMAGE_MAX_ROLLS = 6;

/** Типы урона для своего заклинания: коды бэкенда без легаси-дублей. */
export const SPELL_DAMAGE_TYPE_KEYS = [
  'FAIR',
  'COLD',
  'LIGHTNING',
  'THUNDER',
  'ACID',
  'POISON',
  'NECROTIC',
  'RADIANT',
  'FORCE',
  'PSYCHIC',
  'BLUDGEONING',
  'PIERCING',
  'SLASHING',
] as const;

/** Чип отбора списка заклинаний: общий вид, выбранный и обычный. */
export const SPELL_FILTER_CHIP_CLASS = {
  base: 'cursor-pointer rounded border px-2 py-1 text-xs transition-colors',
  idle: 'border-default text-toned hover:border-primary/60',
  selected: 'border-primary bg-primary/10 text-primary',
} as const;

/** Квадрат со значком заклинания: подготовленное и обычное. */
export const SPELL_ICON_CLASS = {
  base: 'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors',
  prepared: 'border-primary/60 bg-primary/15 text-primary',
  idle: 'border-default/50 bg-default/40 text-muted hover:border-primary/60',
} as const;

/** Ключи групп фильтра раздела заклинаний. */
export const SPELL_FILTER_KEYS = {
  class: 'class',
  level: 'level',
} as const;

/** Подписи окна добавления заклинаний из справочника. */
export const SPELL_ADD_TEXT = {
  title: 'Заклинания из справочника',
  added: 'В книге',
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

/** Подписи окна опыта и уровня. */
export const EXPERIENCE_TEXT = {
  title: 'Опыт и уровень',
  level: 'Уровень',
  experience: 'Опыт',
  remaining: 'До следующего уровня',
  maxLevel: 'Достигнут последний уровень',
  gain: 'Получить опыт',
  gainPlaceholder: 'Сколько',
  gainApply: 'Добавить',
  gainHint: 'Отрицательное число отнимет опыт.',
  readyTitle: 'Опыта хватает на повышение',
  readyDescription: 'По опыту персонажу положен уровень',
  readyHint: 'Повысьте уровень одного из классов ниже.',
  classes: 'Уровни классов',
  noClasses: 'У персонажа пока нет класса: уровень растёт вместе с ним.',
  pickClass: 'Взять класс',
  close: 'Закрыть',
} as const;

/* --- Отдых -------------------------------------------------------------- */

/** Значки отдыха: те же, что на кнопках в шапке листа. */
export const REST_ICON = {
  short: 'tabler:campfire',
  long: 'tabler:moon',
  dawn: 'tabler:sunrise',
} as const;

export const REST_TEXT = {
  shortTitle: 'Короткий отдых',
  longTitle: 'Долгий отдых',
  pactSlots: 'Ячейки магии договора',
  spellSlots: 'Ячейки заклинаний',
  charges: 'Заряды предметов',
  dawn: 'Наступил рассвет',
  dawnDone: 'Заряды предметов на рассвете восстановлены',
  rulesTitle: 'Правила отдыха',
  hitPoints: 'Хиты',
  recoveryTitle: 'Вернётся по окончании отдыха',
  noDice:
    'Костей хитов нет: они появятся вместе с классом или в настройке здоровья.',
  close: 'Закрыть',
  finish: 'Завершить отдых',
  recoveredLabel: 'Вернулись',
  shortIntro:
    'Короткий отдых — не меньше часа спокойного времени: персонаж ест, пьёт, перевязывает раны. В конце отдыха можно потратить кости хитов.',
  constitution: 'Модификатор Телосложения',
  constitutionHint: 'Прибавляется к каждой брошенной кости хитов',
  diceTitle: 'Кости хитов',
  diceHint: 'Выберите, сколько костей потратить',
  diceAdd: 'Добавить к броску кость',
  diceRemove: 'Убрать из броска кость',
  roll: 'Бросить кости',
  rollLogTitle: 'Броски отдыха',
  rollTotal: 'Итого по броскам',
  spentDice: 'Все кости хитов потрачены — часть вернёт долгий отдых.',
  shortFinished: 'Короткий отдых завершён',
  shortHitPoints: 'Восстановлено хитов',
  shortEmpty: 'Кости хитов не тратились.',
  longIntro:
    'Долгий отдых — не меньше 8 часов: сон не меньше 6 часов, остальное — чтение, разговоры, еда или дежурство. В конце персонаж восстанавливает все хиты и половину костей хитов.',
  hitPointsRecovery: 'Восстановятся полностью.',
  temporaryNote: 'Временные хиты пропадут.',
  zeroHitPointsTitle: 'Нужен хотя бы 1 хит',
  zeroHitPointsDescription:
    'Пользу долгого отдыха получает персонаж, у которого в начале отдыха есть хотя бы 1 хит.',
  exhaustionTitle: 'Истощение',
  exhaustionRecovery:
    'Отдых снимет 1 степень истощения, если персонаж поел и попил.',
  longDiceHint: 'Вернётся половина от всех костей, но не меньше одной',
  longDiceFull: 'Все кости хитов на месте — возвращать нечего.',
  longFinished: 'Долгий отдых завершён',
  longHitPoints: 'Хиты восстановлены полностью.',
  longDice: 'Возвращено костей хитов',
  longExhaustion: 'Степень истощения',
} as const;

/** Правила короткого отдыха (PHB 2014) для справки в окне. */
export const SHORT_REST_RULES = [
  'Отдых длится не меньше часа. Всё это время персонаж не делает ничего утомительнее еды, питья, чтения и перевязки ран.',
  'В конце отдыха можно потратить одну или несколько костей хитов — не больше, чем осталось. За каждую кость бросается её номинал и прибавляется модификатор Телосложения: столько хитов персонаж и восстанавливает.',
  'Сколько костей бросить дальше, решается после каждого броска.',
  'Потраченные кости хитов возвращает только долгий отдых.',
  'По окончании отдыха возвращаются ячейки магии договора колдуна и умения, которые восстанавливаются после короткого отдыха.',
] as const;

/** Правила долгого отдыха (PHB 2014) для справки в окне. */
export const LONG_REST_RULES = [
  'Отдых длится не меньше 8 часов: сон не меньше 6 часов и не больше 2 часов лёгких занятий — чтения, разговоров, еды или дежурства.',
  'Час ходьбы, боя, сотворения заклинаний или другой утомительной деятельности прерывает отдых: его придётся начинать заново.',
  'В конце отдыха персонаж восстанавливает все хиты и потраченные кости хитов — не больше половины от их общего числа, но хотя бы одну.',
  'Возвращаются все ячейки заклинаний и умения, которые восстанавливаются после долгого отдыха.',
  'Поевший и попивший персонаж снимает 1 степень истощения.',
  'Пользу долгого отдыха получает персонаж, у которого в начале отдыха есть хотя бы 1 хит.',
  'За сутки можно получить пользу только от одного долгого отдыха.',
] as const;

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

/** Подписи окна грузоподъёмности. */
export const CARRYING_TEXT = {
  title: 'Грузоподъёмность',
  description: 'Сколько персонаж может нести и что ему мешает',
  weight: 'Переносимый вес',
  items: 'Предметы',
  coins: 'Монеты',
  capacity: 'Грузоподъёмность',
  formula: 'Сила × 15 × размер',
  size: 'Размер для расчёта',
  sizeAuto: 'Как у персонажа',
  custom: 'Своё значение',
  customHint: 'Пусто — по Силе и размеру',
  bonus: 'Бонус',
  encumbrance: 'Вариант «Нагрузка»',
  encumbranceHint:
    'Больше Силы × 5 — скорость −10 фт; больше Силы × 10 — скорость −20 фт и помеха к проверкам, спасброскам и атакам Силы, Ловкости и Телосложения.',
  encumbered: 'Нагружен: скорость −10 фт',
  heavilyEncumbered:
    'Сильно нагружен: скорость −20 фт, помеха к броскам Силы, Ловкости и Телосложения',
  overloaded: 'Вес больше грузоподъёмности',
  armorStrength: 'Доспеху не хватает Силы: скорость −10 фт',
  thresholds: 'Нагружен / сильно нагружен с',
  unit: 'фнт',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Подписи окна монет. */
export const CURRENCY_TEXT = {
  title: 'Монеты',
  description: 'Монеты весят: 50 монет — фунт',
  custom: 'Свои валюты',
  customHint: 'Жетоны, трофеи, местные деньги: веса не имеют.',
  name: 'Название',
  namePlaceholder: 'Жетон гильдии',
  short: 'Сокр.',
  amount: 'Сколько',
  add: 'Добавить валюту',
  total: 'Всего в золоте',
  apply: 'Применить',
  cancel: 'Отмена',
} as const;

/** Стоимость монет в медяках: для пересчёта в золото. */
export const CURRENCY_COPPER_VALUE = {
  cp: 1,
  sp: 10,
  ep: 50,
  gp: 100,
  pp: 1000,
} as const;

/** Подписи строки предмета. */
export const ITEM_ROW_TEXT = {
  absent: 'Нет в наличии',
  absentHint:
    'Количество 0: предмет не весит, его нельзя надеть и атаковать им',
  twoHanded: 'Двумя руками',
  oneHanded: 'Одной рукой',
  gripTwo: 'Взять двумя руками',
  gripOne: 'Взять одной рукой',
  active: 'Включён',
  activate: 'Включить',
  deactivate: 'Выключить',
  inactiveHint: 'Механика предмета работает, только пока он включён',
  heavy: 'Тяжёлое',
  heavyHint: 'Маленькие существа атакуют тяжёлым оружием с помехой',
  custom: 'Свой',
  cost: 'Цена',
  copy: 'Копия в свой предмет',
  copied: 'Копия добавлена — её можно править',
  preview: 'Открыть описание',
  expand: 'Показать описание',
  collapse: 'Скрыть описание',
  notWorking: 'Не работает, пока предмет не надет',
  notAttuned: 'Не работает, пока предмет не настроен',
  attackAbility: 'Характеристика',
  attackProficiency: 'Владение',
  attackMagic: 'Магия',
  attackEffects: 'Эффекты',
  attackNoProficiency: 'Нет владения',
} as const;

/** Вид своего предмета в форме. */
export const ITEM_KINDS = ['other', 'weapon', 'armor'] as const;

export const ITEM_KIND_LABELS = {
  other: 'Предмет',
  weapon: 'Оружие',
  armor: 'Доспех',
} as const;

/** Грани костей урона в форме своего оружия. */
export const DAMAGE_DIE_FACES = [4, 6, 8, 10, 12, 20] as const;

/** Пределы числа костей урона. */
export const DAMAGE_DICE_COUNT = { min: 1, max: 10 } as const;

/** Типы урона оружия в форме: подписи как в справочнике оружия. */
export const WEAPON_DAMAGE_TYPES = [
  'рубящий',
  'колющий',
  'дробящий',
  'огонь',
  'холод',
  'электричество',
  'звук',
  'яд',
  'кислота',
  'некротическая энергия',
  'излучение',
  'силовое поле',
  'психическая энергия',
] as const;

/** Подписи окна предмета. */
export const ITEM_FORM_TEXT = {
  title: 'Предмет',
  customTitle: 'Свой предмет',
  tabMain: 'Основное',
  tabMagic: 'Магия',
  kind: 'Вид',
  cost: 'Цена',
  costPlaceholder: '15 зм',
  category: 'Категория',
  simple: 'Простое',
  martial: 'Воинское',
  heavy: 'Тяжёлое',
  dice: 'Кости урона',
  diceCount: 'Сколько костей',
  diceFaces: 'Кость',
  versatile: 'Двумя руками',
  versatileNone: 'Нет',
  strengthRequirement: 'Нужна Сила',
  description: 'Описание',
  descriptionPlaceholder: 'Как выглядит предмет и что он делает',
  extraDamage: 'Дополнительный урон',
  extraNone: 'Нет',
  activatable: 'Включается и выключается',
  activatableHint: 'Механика работает, только пока предмет включён',
  summary: 'Что даёт предмет',
  summaryEmpty: 'Магических свойств пока нет',
  bonusAttack: 'к атаке и урону',
  bonusArmor: 'к КД',
  effects: 'Эффектов из справочника',
  charges: 'Заряды',
  catalogHint:
    'Предмет из справочника: правятся количество, бонус, заряды и заметки. Чтобы поменять всё, сделайте копию в свой предмет.',
} as const;

/** Раскладки клавиатуры: поиск, набранный не в той раскладке. */
export const KEYBOARD_LAYOUT_EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";

export const KEYBOARD_LAYOUT_RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';

/** Подписи окна добавления предметов из справочника. */
export const CATALOG_ADD_TEXT = {
  search: 'Поиск по названию',
  filter: 'Фильтр',
  sources: 'Источники',
  loading: 'Загружаем справочник…',
  error: 'Не удалось загрузить справочник',
  retry: 'Повторить',
  empty: 'Ничего не найдено',
  added: 'Уже в снаряжении',
  preview: 'Открыть описание',
  select: 'Выбрать',
  selected: 'Выбрано',
  add: 'Добавить',
  addFailed: 'Не удалось добавить предметы',
  cancel: 'Отмена',
  clear: 'Снять выбор',
} as const;

/* --- Настройка ---------------------------------------------------------- */

/** Сколько предметов персонаж может держать настроенными (DMG). */
export const ATTUNEMENT_LIMIT = 3;

export const ATTUNEMENT_TEXT = {
  title: 'Настройка',
  settings: 'Предел настройки',
  description: 'Сколько предметов персонаж может держать настроенными',
  base: 'Основа',
  baseRule: 'Правило: 3 предмета',
  baseAbility: 'Модификатор характеристики',
  ability: 'Характеристика',
  custom: 'Своё число',
  customHint: 'Пусто — по основе и бонусу',
  bonus: 'Бонус',
  total: 'Предел',
  attunedNow: 'Сейчас настроено',
  itemsTitle: 'Настроенные предметы',
  noItems: 'Настроенных предметов нет',
  apply: 'Применить',
  cancel: 'Отмена',
  attuned: 'Настроен',
  requires: 'Требует настройки',
  limit: 'Настроено предметов',
  overLimit: 'Настроено больше, чем позволяет предел',
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

/* --- Оформление листа (как на new.ttg.club) ----------------------------- */

/**
 * Класс скрытия кнопки правки у запертого листа: видимостью, а не удалением —
 * раскладка не съезжает.
 */
export const SHEET_HIDDEN_CONTROL_CLASS = 'invisible';

/** Кнопка правки, которую на широком экране проявляет наведение. */
export const SHEET_REVEAL_CONTROL_CLASS = 'max-lg:opacity-100';

/** Кнопка действия в заголовке панели (шестерёнка, справка). */
export const SHEET_TITLE_ACTION_CLASS =
  'flex cursor-pointer items-center text-primary transition-colors hover:text-highlighted';

/** Действие заголовка, которое проявляет наведение на панель. */
export const SHEET_TITLE_ACTION_REVEAL_CLASS = `opacity-0 transition-opacity duration-200 group-hover/panel:opacity-100 focus-visible:opacity-100 ${SHEET_REVEAL_CONTROL_CLASS}`;

/** Плитка-кнопка в шапке вкладки (вес, настройка, заклинательство). */
const SHEET_STAT_TILE_CLASS =
  'flex h-7 items-center gap-3 rounded-lg border border-default/50 bg-elevated/20 px-3 transition-colors';

export const SHEET_HEADER_STAT_CLASS = `${SHEET_STAT_TILE_CLASS} cursor-pointer hover:border-primary/60`;

export const SHEET_STATIC_STAT_CLASS = `${SHEET_STAT_TILE_CLASS} cursor-default`;

/** Подпись разделителя группы (навыки, снаряжение). */
export const SHEET_GROUP_LABEL_CLASS =
  'shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase';

/** Плитка параметра предмета: тёплый акцент (атака, урон, КД). */
export const SHEET_ACCENT_STAT_CLASSES = {
  container: 'border-primary/40 bg-primary/10',
  value: 'text-primary',
  label: 'text-primary/80',
} as const;

/** Плитка параметра предмета: обычная (вес, заряды). */
export const SHEET_PLAIN_STAT_CLASSES = {
  container: 'border-default/50 bg-default/40',
  value: 'text-highlighted',
  label: 'text-dimmed',
} as const;

/** Раскладка плитки параметра предмета. */
export const SHEET_ITEM_STAT_LAYOUT_CLASS =
  'flex shrink-0 grow basis-0 flex-col items-center rounded border px-2 py-0.5 whitespace-nowrap @xl:grow-0 @xl:basis-auto';

/** Плитка параметра — кнопка броска. */
export const SHEET_ROLL_STAT_CLASS =
  'relative z-10 cursor-pointer hover:border-primary hover:bg-primary/20';

export const SHEET_BODY_LABELS = {
  proficiencyBonus: 'Мастерство',
  armorClass: 'Класс доспеха',
  armorClassShort: 'КД',
  armorClassPress: 'Настроить класс доспеха',
  walk: 'Ходьба',
  initiative: 'Инициатива',
  health: 'Здоровье',
  current: 'Сейчас',
  total: 'Всего',
  temporary: 'Врем.',
  hitDice: 'Кости хитов',
  savingThrows: 'Спасброски',
  skills: 'Навыки',
  resources: 'Ресурсы',
  resourcesEmpty: 'Ресурсов пока нет',
  settings: 'Настроить',
  spend: 'Потратить',
  restore: 'Вернуть',
  roll: 'Бросок',
  proficiency: 'Владение',
  passive: 'Пассивное значение',
  weight: 'Переносимый вес',
  attunement: 'Настройка',
  levelPrefix: 'Уровень',
  experience: 'Опыт',
  inspiration: 'Вдохновение',
  lock: 'Запереть лист',
  unlock: 'Отпереть лист',
  menu: 'Меню',
  close: 'Закрыть',
  avatar: 'Портрет персонажа',
  name: 'Имя персонажа',
  noRace: 'Раса',
  noBackground: 'Предыстория',
  vision: 'Чувства',
  proficienciesEmpty: 'Нет',
  manualProficiencies: 'Свои владения текстом',
  equipped: 'Надет',
  attuned: 'Настроен',
  needsAttunement: 'Нет настройки',
  needsAttunementHint:
    'Предмет требует настройки: без неё его эффекты не работают',
  equip: 'Надеть',
  unequip: 'Снять',
  attune: 'Настроить',
  unattune: 'Снять настройку',
  restoreCharges: 'Восстановить заряды',
  charges: 'заряды',
  attack: 'атака',
  damage: 'урон',
  armorClassStat: 'КД',
  weightStat: 'вес',
  edit: 'Изменить',
  remove: 'Удалить',
  quantityDecrease: 'Меньше',
  quantityIncrease: 'Больше',
  addItem: 'Добавить',
  emptyEquipment: 'Снаряжения пока нет',
  dawn: 'Рассвет',
} as const;

/** Группы снаряжения на вкладке. */
export const INVENTORY_GROUPS = [
  { key: 'weapon', title: 'Оружие', icon: 'tabler:sword' },
  { key: 'armor', title: 'Доспехи', icon: 'tabler:shield' },
  { key: 'magic', title: 'Магические предметы', icon: 'tabler:wand' },
  { key: 'other', title: 'Прочее', icon: 'tabler:backpack' },
] as const;

/** Значки отдыха у ресурса: что возвращает короткий и долгий отдых. */
export const RESOURCE_RECOVERY_BADGES = {
  SHORT: [
    {
      rest: 'short',
      icon: 'tabler:campfire',
      text: 'все',
      hint: 'Короткий отдых возвращает все',
    },
  ],
  SHORT_ONE: [
    {
      rest: 'short',
      icon: 'tabler:campfire',
      text: '1',
      hint: 'Короткий отдых возвращает один',
    },
    {
      rest: 'long',
      icon: 'tabler:moon',
      text: 'все',
      hint: 'Долгий отдых возвращает все',
    },
  ],
  LONG: [
    {
      rest: 'long',
      icon: 'tabler:moon',
      text: 'все',
      hint: 'Долгий отдых возвращает все',
    },
  ],
} as const;

/** Значки владения спасброском и навыком. */
export const PROFICIENCY_DOT_ICONS = {
  none: 'tabler:circle',
  half: 'tabler:circle-half-2',
  proficient: 'tabler:circle-filled',
  expertise: 'tabler:square-rounded-chevrons-up',
} as const;

export const EXHAUSTION_PANEL_LABELS = {
  title: 'Истощение',
  rules: 'Истощение (PHB 2014)',
  none: 'Истощения нет',
  level: 'Ступень',
  longRest: 'Долгий отдых с едой и питьём снимает одну ступень.',
} as const;

export const SHEET_MENU_LABELS = {
  backToList: 'К списку листов',
  reload: 'Перезагрузить',
  settings: 'Настройки листа',
  abilityScores: 'Калькулятор характеристик',
  downloadJson: 'Скачать JSON',
  copy: 'Создать копию',
  remove: 'Удалить лист',
  dawn: 'Наступил рассвет',
} as const;

/** Пометки шагов мастера повышения уровня. */
export const LEVEL_UP_RAIL_CLASSES = {
  done: 'border-primary/60 bg-primary/15 text-primary',
  current: 'border-primary bg-primary text-inverted',
  upcoming: 'border-default text-muted',
} as const;

/* --- Список листов ------------------------------------------------------ */

export const SHEET_LIST_TEXT = {
  ownTitle: 'Ваши персонажи',
  countTooltip:
    'Сколько листов уже создано и сколько можно вести одновременно. Чтобы создать новый сверх лимита, удалите один из существующих.',
  limitReached:
    'Достигнут лимит листов: удалите один из существующих, чтобы создать новый.',
  create: 'Создать лист',
  createAria: 'Создать новый лист персонажа',
  openAria: 'Открыть лист',
  menuAria: 'Действия с листом',
  noRace: 'Без расы',
  hitPoints: 'Хиты',
  level: 'Уровень',
  download: 'Скачать JSON',
  importLabel: 'Импорт JSON',
  importHint: 'Создаст лист из JSON-файла нашего экспорта',
  importFailed: 'Не удалось импортировать лист',
  importLimit: 'Достигнут лимит листов: импорт невозможен',
  importSuccess: 'Лист импортирован',
} as const;

export const SHEET_LIST_ICON = {
  avatar: 'tabler:user',
  create: 'tabler:user-plus',
  hitPoints: 'tabler:heart',
  help: 'tabler:help-circle-filled',
  download: 'tabler:download',
  import: 'tabler:file-import',
} as const;

/** Причина отказа импорта: файл не JSON или не лист персонажа. */
export const SHEET_IMPORT_ERROR_TEXT = {
  invalidJson: 'Файл не читается как JSON',
  invalidFormat: 'Файл не похож на лист персонажа',
} as const;

/** Какие файлы принимает импорт листа. */
export const SHEET_IMPORT_ACCEPT = '.json,application/json';

/** Расширение и тип файла экспорта листа. */
export const SHEET_EXPORT_FILE = {
  extension: '.json',
  mimeType: 'application/json',
  indent: 2,
} as const;

/** Символы, недопустимые в имени файла: заменяются при экспорте. */
export const SHEET_FILE_NAME_FORBIDDEN = /[/:*?"<>|]+/g;

/* --- Выбор класса и расы ------------------------------------------------ */

/** Локаль сортировки записей в окнах выбора класса и расы. */
export const CATALOG_TREE_COLLATOR_LOCALE = 'ru';

/** Кость хитов своего класса по умолчанию. */
export const CUSTOM_CLASS_DEFAULT_HIT_DIE = 8;

/** Подпись кости хитов в выборе: «к8». */
export const HIT_DIE_LABEL_PREFIX = 'к';

export const CATALOG_TREE_TEXT = {
  classTitle: 'Добавление класса',
  raceTitle: 'Выбор расы',
  searchPlaceholder: 'Поиск по названию…',
  empty: 'Ничего не найдено',
  loadFailed: 'Не удалось загрузить список',
  classHint:
    'Класс добавится первым уровнем — общий уровень персонажа вырастет на единицу. Дальше его поднимают в окне классов кнопкой «Повысить уровень». Подкласс выбирается на уровне, указанном в классе.',
  raceHint:
    'Раса заменит текущую: её бонусы, чувства, скорости и владения применятся к листу, выборы откроются сразу. Можно выбрать и разновидность.',
  expandClass: 'Показать подклассы',
  expandRace: 'Показать разновидности',
  preview: 'Открыть в справочнике',
  pick: 'Выбрать',
  next: 'Далее',
  cancel: 'Отмена',
  save: 'Сохранить',
  customClass: 'Свой класс',
  customRace: 'Своя раса',
  customName: 'Название',
  customHitDie: 'Кость хитов',
  customClassHint:
    'Класса нет в справочнике: умения и владения добавьте вручную, уровни и хиты лист посчитает сам.',
  customRaceHint:
    'Расы нет в справочнике: бонусы, скорость и особенности добавьте вручную.',
} as const;

export const CATALOG_TREE_ICON = {
  expand: 'tabler:chevron-right',
  preview: 'tabler:layout-sidebar-right-expand',
  next: 'tabler:arrow-right',
  selected: 'tabler:check',
  add: 'tabler:plus',
} as const;

/** Классы строки выбора: выбранная подсвечена основным цветом. */
export const CATALOG_TREE_ROW_CLASSES = {
  selected: 'bg-primary/10 ring-1 ring-inset ring-primary/40',
  idle: 'hover:bg-elevated/60',
} as const;

/** Поворот шеврона раскрытой строки. */
export const CATALOG_TREE_EXPANDED_CLASS = 'rotate-90';

/* --- Размер и чувства --------------------------------------------------- */

/** Размеры существ PHB 2014. */
export const SHEET_SIZE_KEYS = [
  'TINY',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'HUGE',
  'GARGANTUAN',
] as const;

/** Названия размеров и буква значка у портрета. */
export const SHEET_SIZE_INFO = {
  TINY: { name: 'Крошечный', letter: 'К' },
  SMALL: { name: 'Маленький', letter: 'М' },
  MEDIUM: { name: 'Средний', letter: 'С' },
  LARGE: { name: 'Большой', letter: 'Б' },
  HUGE: { name: 'Огромный', letter: 'О' },
  GARGANTUAN: { name: 'Громадный', letter: 'Г' },
} as const;

export const SHEET_SIZE_LABELS = {
  title: 'Размер персонажа',
  field: 'Размер',
  placeholder: 'Не задан',
  empty: 'Размер не задан',
  open: 'Настроить размер',
  reset: 'Сбросить',
  cancel: 'Отмена',
  apply: 'Применить',
} as const;

/** Чувства, кроме тёмного зрения, которые игрок задаёт сам. */
export const OWN_SENSE_KEYS = [
  'BLINDSIGHT',
  'TREMORSENSE',
  'TRUESIGHT',
] as const;

/** Наибольшая дистанция чувства в поле окна, фт. */
export const SENSE_RANGE_MAX = 1000;

/** Шаг дистанции чувства, фт. */
export const SENSE_RANGE_STEP = 5;

export const SHEET_VISION_LABELS = {
  title: 'Чувства',
  open: 'Настроить чувства',
  normal: 'Обычное зрение',
  unit: 'фт.',
  hint: 'Своё значение. Особенности, снаряжение и эффекты могут дать больше: лист берёт большее.',
  effective: 'В листе',
  cancel: 'Отмена',
  apply: 'Применить',
} as const;
