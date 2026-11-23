import type { SelectOption } from '../types';

// Константы соседних разделов берутся из их файлов, а не баррелей: барели
// тянут схемы, которые сами импортируют механику, и цикл импортов отдал бы
// здесь ещё не созданные списки
import { ARMOR_TYPE_OPTIONS } from '../armors/constants';
import { WORKSHOP_ABILITY_OPTIONS, WORKSHOP_SKILL_OPTIONS } from '../constants';
import { RACE_TYPE_OPTIONS } from '../races/constants';
import { SPELL_SCHOOL_OPTIONS } from '../spells/constants';
import { WEAPON_TYPE_OPTIONS } from '../weapons/constants';

/**
 * Вид механики записи: от него зависит набор блоков. Модели бэкенда:
 * - `class` — `ClassMechanics` (класс, архетип, их умения, особенности классов);
 * - `race` — `RaceMechanics` (раса и её особенности);
 * - `feat` — `FeatMechanics` (черта и предыстория).
 */
export const MECHANICS_KIND = {
  class: 'class',
  race: 'race',
  feat: 'feat',
} as const;

export type MechanicsKind =
  (typeof MECHANICS_KIND)[keyof typeof MECHANICS_KIND];

/** Блоки механики: имена полей модели бэкенда. */
export const MECHANICS_BLOCK = {
  abilityBonuses: 'abilityBonuses',
  proficiencies: 'proficiencies',
  choices: 'choices',
  modifiers: 'modifiers',
  counters: 'counters',
  spells: 'spells',
  spellList: 'spellList',
  feats: 'feats',
} as const;

export type MechanicsBlock =
  (typeof MECHANICS_BLOCK)[keyof typeof MECHANICS_BLOCK];

/** Какие блоки есть у механики каждого вида — как поля моделей бэкенда. */
export const MECHANICS_KIND_BLOCKS: Readonly<
  Record<MechanicsKind, ReadonlyArray<MechanicsBlock>>
> = {
  class: [
    MECHANICS_BLOCK.proficiencies,
    MECHANICS_BLOCK.choices,
    MECHANICS_BLOCK.modifiers,
    MECHANICS_BLOCK.counters,
    MECHANICS_BLOCK.spells,
    MECHANICS_BLOCK.spellList,
    MECHANICS_BLOCK.feats,
  ],
  race: [
    MECHANICS_BLOCK.abilityBonuses,
    MECHANICS_BLOCK.proficiencies,
    MECHANICS_BLOCK.choices,
    MECHANICS_BLOCK.modifiers,
    MECHANICS_BLOCK.counters,
    MECHANICS_BLOCK.spellList,
  ],
  feat: [
    MECHANICS_BLOCK.abilityBonuses,
    MECHANICS_BLOCK.proficiencies,
    MECHANICS_BLOCK.choices,
    MECHANICS_BLOCK.modifiers,
    MECHANICS_BLOCK.counters,
    MECHANICS_BLOCK.spells,
    MECHANICS_BLOCK.spellList,
  ],
};

/** Все коды `AbilityType` бэкенда: служебные варианты тоже, чтобы их не терять. */
export const MECHANICS_ABILITY_CODES: ReadonlyArray<string> = [
  ...WORKSHOP_ABILITY_OPTIONS.map(({ value }) => value),
  'CHOICE',
  'ONE',
  'CHOICE_UNIQUE',
  'CHOICE_DOUBLE',
];

/** Языки (`LanguageType`); небесный на бэкенде так и пишется — `Celestial`. */
export const MECHANICS_LANGUAGE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Общий', value: 'COMMON' },
  { label: 'Общий язык жестов', value: 'COMMON_SIGN_LANGUAGE' },
  { label: 'Драконий', value: 'DRACONIC' },
  { label: 'Дварфский', value: 'DWARVISH' },
  { label: 'Эльфийский', value: 'ELVISH' },
  { label: 'Великаний', value: 'GIANT' },
  { label: 'Гномий', value: 'GNOMISH' },
  { label: 'Гоблинский', value: 'GOBLIN' },
  { label: 'Полуросликов', value: 'HALFLING' },
  { label: 'Орочий', value: 'ORC' },
  { label: 'Бездны', value: 'ABYSSAL' },
  { label: 'Небесный', value: 'Celestial' },
  { label: 'Глубинная речь', value: 'DEEP' },
  { label: 'Друидический', value: 'DRUIDIC' },
  { label: 'Инфернальный', value: 'INFERNAL' },
  { label: 'Первичный', value: 'PRIMORDIAL' },
  { label: 'Сильван', value: 'SYLVAN' },
  { label: 'Воровской жаргон', value: 'THIEVES' },
  { label: 'Подземный', value: 'UNDERCOMMON' },
];

/**
 * Виды урона (`DamageType`): коды бэкенда, в том числе с опечатками (`FAIR` —
 * огонь) и легаси-дубли (`NECTOTIC`, `SOUND`).
 */
export const MECHANICS_DAMAGE_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
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
  { label: 'Звук (легаси)', value: 'SOUND' },
  { label: 'Некротическая энергия (легаси)', value: 'NECTOTIC' },
  { label: 'Физический немагический', value: 'PHYSICAL' },
  { label: 'Физический, кроме посеребрённого', value: 'NO_NOSILVER' },
  { label: 'Физический, кроме адамантинового', value: 'NO_ADMANTIT' },
  { label: 'Физический магический', value: 'PHYSICAL_MAGIC' },
  { label: 'Колющий магический от добрых', value: 'PIERCING_GOOD' },
  { label: 'Урон от заклинаний', value: 'MAGIC' },
  { label: 'Физический в тусклом свете или тьме', value: 'DARK' },
  { label: 'Физический от металлического оружия', value: 'METAL_WEAPON' },
  { label: 'Рубящий меча головоруба', value: 'VORPAL_SWORD' },
  { label: 'Без урона', value: 'NO_DAMAGE' },
];

/** Состояния (`Condition`), к которым бывает иммунитет. */
export const MECHANICS_CONDITION_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Ослепление', value: 'BLINDED' },
  { label: 'Очарование', value: 'CHARMED' },
  { label: 'Глухота', value: 'DEAFENED' },
  { label: 'Истощение', value: 'EXHAUSTION' },
  { label: 'Испуг', value: 'FRIGHTENED' },
  { label: 'Захват', value: 'GRAPPLED' },
  { label: 'Недееспособность', value: 'INCAPACITATED' },
  { label: 'Паралич', value: 'PARALYZED' },
  { label: 'Окаменение', value: 'PETRIFIED' },
  { label: 'Отравление', value: 'POISONED' },
  { label: 'Сбивание с ног', value: 'PRONE' },
  { label: 'Опутанность', value: 'RESTRAINED' },
  { label: 'Ошеломление', value: 'STUNNED' },
  { label: 'Бессознательность', value: 'UNCONSCIOUS' },
];

/** Все коды `Condition` бэкенда: служебные тоже, чтобы их не терять. */
export const MECHANICS_CONDITION_CODES: ReadonlyArray<string> = [
  ...MECHANICS_CONDITION_OPTIONS.map(({ value }) => value),
  'DYING',
  'EVASIONS',
  'INVISIBLE',
];

/** Чувства (`SenseType`). */
export const MECHANICS_SENSE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Тёмное зрение', value: 'DARKVISION' },
  { label: 'Слепое зрение', value: 'BLINDSIGHT' },
  { label: 'Истинное зрение', value: 'TRUESIGHT' },
  { label: 'Чувство вибрации', value: 'TREMORSENSE' },
];

/** Время накладывания в фильтре заклинаний (`CastingUnit`). */
export const MECHANICS_CASTING_UNIT_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Бонусное действие', value: 'BONUS' },
  { label: 'Реакция', value: 'REACTION' },
  { label: 'Действие', value: 'ACTION' },
  { label: 'Раунд', value: 'ROUND' },
  { label: 'Минута', value: 'MINUTE' },
  { label: 'Ритуал', value: 'RITUAL' },
  { label: 'Час', value: 'HOUR' },
  { label: 'Особое', value: 'SPECIAL' },
];

/** Что выбирают (`ChoiceType`). */
export const MECHANICS_CHOICE_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Характеристика', value: 'ABILITY' },
  { label: 'Спасбросок', value: 'SAVING_THROW' },
  { label: 'Навык', value: 'SKILL' },
  { label: 'Инструмент', value: 'TOOL' },
  { label: 'Язык', value: 'LANGUAGE' },
  { label: 'Тип урона', value: 'DAMAGE_TYPE' },
  { label: 'Заклинание', value: 'SPELL' },
  { label: 'Заговор', value: 'CANTRIP' },
  { label: 'Список заклинаний', value: 'SPELL_LIST' },
  { label: 'Заклинательная характеристика', value: 'SPELLCASTING_ABILITY' },
  { label: 'Оружие', value: 'WEAPON' },
  { label: 'Доспехи', value: 'ARMOR' },
  { label: 'Вариант', value: 'OPTION' },
  { label: 'Черта', value: 'FEAT' },
];

/** Виды выбора, у которых есть фильтр заклинаний. */
export const MECHANICS_SPELL_CHOICE_TYPES: ReadonlySet<string> = new Set([
  'SPELL',
  'CANTRIP',
]);

/**
 * Готовые варианты по виду выбора: из них варианты добавляются одним
 * щелчком. У остальных видов значение — url записи или свой ключ.
 */
export const MECHANICS_CHOICE_PRESETS: Readonly<
  Record<string, ReadonlyArray<SelectOption>>
> = {
  ABILITY: WORKSHOP_ABILITY_OPTIONS,
  SAVING_THROW: WORKSHOP_ABILITY_OPTIONS,
  SPELLCASTING_ABILITY: WORKSHOP_ABILITY_OPTIONS,
  SKILL: WORKSHOP_SKILL_OPTIONS,
  LANGUAGE: MECHANICS_LANGUAGE_OPTIONS,
  DAMAGE_TYPE: MECHANICS_DAMAGE_TYPE_OPTIONS,
  ARMOR: ARMOR_TYPE_OPTIONS,
  WEAPON: WEAPON_TYPE_OPTIONS,
};

/** Что даёт выбор (`ChoiceGrant`). */
export const MECHANICS_CHOICE_GRANT_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Владение', value: 'PROFICIENCY' },
  { label: 'Компетентность', value: 'EXPERTISE' },
];

/** Что получает выбранный тип урона (`DamageDefenseKind`). */
export const MECHANICS_DEFENSE_KIND_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Сопротивление', value: 'RESISTANCE' },
  { label: 'Иммунитет', value: 'IMMUNITY' },
  { label: 'Уязвимость', value: 'VULNERABILITY' },
];

/** Сколько возвращает отдых (`CounterRestMode`). */
export const COUNTER_REST_MODE = {
  none: 'NONE',
  all: 'ALL',
  amount: 'AMOUNT',
} as const;

/** Варианты отката ресурса на отдыхе. */
export const MECHANICS_REST_MODE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Не восстанавливает', value: COUNTER_REST_MODE.none },
  { label: 'Все заряды', value: COUNTER_REST_MODE.all },
  { label: 'Число зарядов', value: COUNTER_REST_MODE.amount },
];

/** Легаси-откат ресурса (`ResourceRecovery`): читается, если правил отдыха нет. */
export const COUNTER_LEGACY_RECOVERY = {
  shortRest: 'SHORT_REST',
  longRest: 'LONG_REST',
  shortRestOne: 'SHORT_REST_ONE',
} as const;

/** Наименьшее число зарядов, которое возвращает отдых в режиме `AMOUNT`. */
export const COUNTER_MIN_REST_AMOUNT = 1;

/** Когда работает механика магического предмета (`MagicItemActivation`). */
export const MAGIC_ITEM_ACTIVATION_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'При себе', value: 'CARRIED' },
  { label: 'Надет', value: 'WORN' },
  { label: 'В руке', value: 'HELD' },
  { label: 'Экипирован', value: 'EQUIPPED' },
  { label: 'При использовании', value: 'CONSUMED' },
  { label: 'Вручную', value: 'MANUAL' },
];

/**
 * Условия, при которых предмет применяют: эффект такого предмета не работает
 * сам, его копия ложится при применении.
 */
export const MAGIC_ITEM_USED_ACTIVATIONS: ReadonlySet<string> = new Set([
  'CONSUMED',
  'MANUAL',
]);

/** Когда предмет восстанавливает заряды (`MagicItemRechargeEvent`). */
export const MAGIC_ITEM_RECHARGE_EVENT_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'На рассвете', value: 'DAWN' },
  { label: 'После короткого отдыха', value: 'SHORT_REST' },
  { label: 'После продолжительного отдыха', value: 'LONG_REST' },
];

/** Типы магических предметов-оружия: их эффект может лечь и на цель. */
export const MAGIC_ITEM_WEAPON_TYPES: ReadonlySet<string> = new Set([
  'MELE_WEAPON',
  'RANGED_WEAPON',
  'WEAPON',
  'AMMUNITION',
]);

/** Наборы кодов для разбора механики из ответа сервера. */
export const MECHANICS_CODES = {
  ability: new Set(MECHANICS_ABILITY_CODES),
  skill: new Set(WORKSHOP_SKILL_OPTIONS.map(({ value }) => value)),
  weaponCategory: new Set(WEAPON_TYPE_OPTIONS.map(({ value }) => value)),
  armorCategory: new Set(ARMOR_TYPE_OPTIONS.map(({ value }) => value)),
  language: new Set(MECHANICS_LANGUAGE_OPTIONS.map(({ value }) => value)),
  damageType: new Set(MECHANICS_DAMAGE_TYPE_OPTIONS.map(({ value }) => value)),
  condition: new Set(MECHANICS_CONDITION_CODES),
  creatureType: new Set(RACE_TYPE_OPTIONS.map(({ value }) => value)),
  sense: new Set(MECHANICS_SENSE_OPTIONS.map(({ value }) => value)),
  magicSchool: new Set(SPELL_SCHOOL_OPTIONS.map(({ value }) => value)),
  castingUnit: new Set(
    MECHANICS_CASTING_UNIT_OPTIONS.map(({ value }) => value),
  ),
  choiceType: new Set(MECHANICS_CHOICE_TYPE_OPTIONS.map(({ value }) => value)),
  choiceGrant: new Set(
    MECHANICS_CHOICE_GRANT_OPTIONS.map(({ value }) => value),
  ),
  defenseKind: new Set(
    MECHANICS_DEFENSE_KIND_OPTIONS.map(({ value }) => value),
  ),
  restMode: new Set(MECHANICS_REST_MODE_OPTIONS.map(({ value }) => value)),
  legacyRecovery: new Set<string>(Object.values(COUNTER_LEGACY_RECOVERY)),
  magicItemActivation: new Set(
    MAGIC_ITEM_ACTIVATION_OPTIONS.map(({ value }) => value),
  ),
  rechargeEvent: new Set(
    MAGIC_ITEM_RECHARGE_EVENT_OPTIONS.map(({ value }) => value),
  ),
} as const;

/** Префиксы ключей, которые получают новые выборы и ресурсы. */
export const MECHANICS_KEY_PREFIX = {
  choice: 'choice',
  counter: 'counter',
} as const;

/** Наибольший уровень персонажа и круг заклинаний в полях механики. */
export const MECHANICS_LIMIT = {
  level: 20,
  spellLevel: 9,
} as const;

/** Формула максимума нового ресурса: бонус мастерства. */
export const MECHANICS_DEFAULT_COUNTER_MAX = '@prof';

/** Подписи редактора механики. */
export const MECHANICS_TEXT = {
  title: 'Механика',
  subtitle: 'Что запись делает на листе персонажа',
  effectsTitle: 'Эффекты',
  traitSection: 'Механика и эффекты',
  traitSectionHint:
    'Владения, выборы, модификаторы, ресурсы и активные эффекты этого умения на листе персонажа',
  add: 'Добавить',
  remove: 'Удалить',
  empty: 'нет',
  url: 'Адрес (url)',
  urlPlaceholder: 'fireball',
  name: 'Название',
  key: 'Ключ',
  keyHelp: 'Стабильный: на него ссылаются другие блоки',
  level: 'Уровень',
  requiredLevel: 'С уровня',
  count: 'Количество',
  abilityBonuses: 'Повышения характеристик',
  abilityBonusesHint:
    'У расы повышения складываются, у черты несколько строк — выбор «или»',
  abilities: 'Характеристики',
  bonus: 'Бонус',
  upto: 'Не выше',
  fromChoiceKey: 'Ключ выбора',
  proficiencies: 'Владения',
  weaponCategories: 'Категории оружия',
  weapons: 'Оружие из справочника',
  armorCategories: 'Доспехи',
  savingThrows: 'Спасброски',
  skills: 'Навыки',
  tools: 'Инструменты из справочника',
  languages: 'Языки',
  choices: 'Выборы',
  choicesHint: 'Что игрок выбирает при получении',
  choiceTypes: 'Что выбирают',
  choiceTypesHelp: 'Первый вид — основной',
  label: 'Подпись для игрока',
  countEqualsProficiencyBonus: 'Количество равно бонусу мастерства',
  grants: 'Что даёт',
  onlyIfNotProficient: 'Только то, чем ещё не владеет',
  onlyIfProficient: 'Только то, чем уже владеет',
  expertiseIfProficient: 'Компетентность, если владение уже есть',
  rechooseOnLongRest: 'Можно менять на продолжительном отдыхе',
  showInTable: 'Колонка в таблице прогрессии',
  shortName: 'Краткая подпись',
  alwaysPrepared: 'Всегда подготовлены',
  options: 'Варианты',
  optionsHint: 'Пусто — любое значение своего вида',
  optionValue: 'Значение',
  addPreset: 'Добавить из списка',
  scaling: 'Ступени по уровням',
  spellFilter: 'Фильтр заклинаний',
  maxLevel: 'Круг не выше',
  schools: 'Школы',
  classes: 'Классы из справочника',
  classesFromChoiceKey: 'Класс из выбора (ключ)',
  castingTime: 'Время накладывания',
  modifiers: 'Модификаторы',
  hitPoints: 'Хиты',
  hitPointsFlat: 'Постоянная прибавка',
  hitPointsPerAcquisitionLevel: 'За уровень на момент получения',
  hitPointsPerLevelAfter: 'За каждый следующий уровень',
  speed: 'Скорости',
  walkBonus: 'Прибавка к ходьбе',
  fly: 'Полёт',
  climb: 'Лазание',
  swim: 'Плавание',
  flyEqualsWalk: 'Полёт равен ходьбе',
  climbEqualsWalk: 'Лазание равно ходьбе',
  swimEqualsWalk: 'Плавание равно ходьбе',
  armorClassBonus: 'Бонус к КД',
  initiativeBonus: 'Бонус к инициативе',
  initiativeProficiencyBonus: 'Бонус мастерства к инициативе',
  telepathyRange: 'Телепатия, фт.',
  creatureType: 'Новый тип существа',
  senses: 'Чувства',
  senseType: 'Чувство',
  range: 'Дистанция, фт.',
  damage: 'Защиты от урона',
  resistances: 'Сопротивления',
  immunities: 'Иммунитеты',
  vulnerabilities: 'Уязвимости',
  defenseChoices: 'Защиты от выбранного типа урона',
  defenseKind: 'Что получает',
  choiceKey: 'Ключ выбора',
  conditionImmunities: 'Иммунитет к состояниям',
  counters: 'Ресурсы',
  countersHint:
    'Максимум — число или формула с @prof, @level, @classLevel, @mod.<abbr>',
  counterMax: 'Максимум',
  counterMin: 'Не меньше',
  shortRest: 'Короткий отдых',
  longRest: 'Продолжительный отдых',
  restAmount: 'Зарядов',
  startsEmpty: 'Появляется пустым',
  spells: 'Выдаваемые заклинания',
  spellcastingAbility: 'Заклинательная характеристика',
  limitedBySlots: 'Только при ячейке его круга',
  classLists: 'Списки классов целиком',
  maxLevelFromSlots: 'Круг по доступным ячейкам',
  spellList: 'Расширение списка заклинаний',
  spellListHint: 'Заклинания, которые добавляются в список класса',
  requiresSpellcasting: 'Нужно «Использование заклинаний» или «Магия договора»',
  groupCount: 'Сколько берут',
  groupCountHelp: 'Число или формула; пусто — весь список',
  groups: 'Группы',
  feats: 'Черты без выбора',
  magicItemActivation: 'Когда работает',
  magicItemPassive: 'Пассивные свойства',
  magicItemPassivePlaceholder: 'Вы можете дышать под водой',
  maxCharges: 'Максимум зарядов',
  recharge: 'Восстановление',
  rechargePlaceholder: '1к6+4',
  rechargeEvent: 'Когда восстанавливается',
  chargeCost: 'Цена применения',
} as const;

/** Иконки редактора механики. */
export const MECHANICS_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
  expand: 'tabler:chevron-right',
  collapse: 'tabler:chevron-down',
  hint: 'tabler:info-circle',
} as const;
