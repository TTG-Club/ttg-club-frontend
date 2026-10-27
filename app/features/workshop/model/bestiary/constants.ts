import type { SelectOption } from '../types';

import { RACE_TYPE_OPTIONS } from '../races';

/** Ключ раздела бестиария в мастерской. */
export const BESTIARY_WORKSHOP_KEY = 'bestiary';

/** Раздел справочника с существами. */
export const BESTIARY_REFERENCE_PATH = '/bestiary';

/** Ручка существ: чтение по английскому названию, создание и правка. */
export const BESTIARY_API_PATH = '/api/v2/bestiary';

/** Типы, которые бэкенд принимает у существ: без паразитов и роёв. */
const CREATURE_TYPE_VALUES: ReadonlySet<string> = new Set([
  'ABERRATION',
  'BEAST',
  'CELESTIAL',
  'CONSTRUCT',
  'DRAGON',
  'ELEMENTAL',
  'FEY',
  'FIEND',
  'GIANT',
  'HUMANOID',
  'MONSTROSITY',
  'PLANT',
  'UNDEAD',
  'SLIME',
  'SMALL_BEAST',
]);

/** Типы существ, как в старом SPA. */
export const CREATURE_TYPE_OPTIONS: ReadonlyArray<SelectOption> =
  RACE_TYPE_OPTIONS.filter((option) => CREATURE_TYPE_VALUES.has(option.value));

/** Мировоззрения. */
export const CREATURE_ALIGNMENT_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Законно-добрый', value: 'LAWFUL_GOOD' },
  { label: 'Законно-нейтральный', value: 'LAWFUL_NEUTRAL' },
  { label: 'Законно-злой', value: 'LAWFUL_EVIL' },
  { label: 'Нейтральный', value: 'TRUE_NEUTRAL' },
  { label: 'Нейтрально-добрый', value: 'NEUTRAL_GOOD' },
  { label: 'Нейтрально-злой', value: 'NEUTRAL_EVIL' },
  { label: 'Хаотично-добрый', value: 'CHAOTIC_GOOD' },
  { label: 'Хаотично-нейтральный', value: 'CHAOTIC_NEUTRAL' },
  { label: 'Хаотично-злой', value: 'CHAOTIC_EVIL' },
  { label: 'Без мировоззрения', value: 'WITHOUT' },
  { label: 'Любое злое мировоззрение', value: 'ALL_EVIL' },
  { label: 'Любое мировоззрение', value: 'ALL' },
  { label: 'Любое не доброе мировоззрение', value: 'NO_GOOD' },
];

/** Доспехи существ: подпись совпадает с карточкой. */
export const CREATURE_ARMOR_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'природный доспех', value: 'NATURAL' },
  { label: 'кожаный доспех', value: 'LEATHER' },
  { label: 'шкурный доспех', value: 'HIDE' },
  { label: 'кольчужная рубаха', value: 'CHAIN_SHIRT' },
  { label: 'кольчатый доспех', value: 'RING_MAIL' },
  { label: 'чешуйчатый доспех', value: 'SCALE_MAIL' },
  { label: 'проклёпаная кожа', value: 'STUDDED_LEATHER' },
  { label: 'кольчуга', value: 'CHAIN_MAIL' },
  { label: 'кираса', value: 'BREASTPLATE' },
  { label: 'полулаты', value: 'HALF_PLATE' },
  { label: 'латный доспех', value: 'PLATE' },
  { label: 'щит', value: 'SHIELD' },
];

/** Виды урона: коды бэкенда, в том числе с его опечатками. */
export const CREATURE_DAMAGE_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'дробящий', value: 'BLUDGEONING' },
  { label: 'колющий', value: 'PIERCING' },
  { label: 'рубящий', value: 'SLASHING' },
  { label: 'огонь', value: 'FAIR' },
  { label: 'холод', value: 'COLD' },
  { label: 'электричество', value: 'LIGHTNING' },
  { label: 'яд', value: 'POISON' },
  { label: 'кислота', value: 'ACID' },
  { label: 'звук', value: 'SOUND' },
  { label: 'некротическая энергия', value: 'NECTOTIC' },
  { label: 'психическая энергия', value: 'PSYCHIC' },
  { label: 'излучение', value: 'RADIANT' },
  { label: 'силовое поле', value: 'FORCE' },
  { label: 'физический', value: 'PHYSICAL' },
  { label: 'физический и не посеребрённое', value: 'NO_NOSILVER' },
  { label: 'физический и не адамантиновое', value: 'NO_ADMANTIT' },
  { label: 'физический магический', value: 'PHYSICAL_MAGIC' },
  { label: 'урон от заклинаний', value: 'MAGIC' },
];

/** Состояния. */
export const CREATURE_CONDITION_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'ослепление', value: 'BLINDED' },
  { label: 'очарование', value: 'CHARMED' },
  { label: 'глухота', value: 'DEAFENED' },
  { label: 'истощение', value: 'EXHAUSTION' },
  { label: 'испуг', value: 'FRIGHTENED' },
  { label: 'захват', value: 'GRAPPLED' },
  { label: 'паралич', value: 'PARALYZED' },
  { label: 'окаменение', value: 'PETRIFIED' },
  { label: 'отравление', value: 'POISONED' },
  { label: 'сбивание с ног', value: 'PRONE' },
  { label: 'опутанность', value: 'RESTRAINED' },
  { label: 'ошеломление', value: 'STUNNED' },
  { label: 'бессознательность', value: 'UNCONSCIOUS' },
];

/** Среды обитания. */
export const CREATURE_ENVIRONMENT_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'полярная тундра', value: 'ARCTIC' },
  { label: 'побережье', value: 'COAST' },
  { label: 'под водой', value: 'WATERS' },
  { label: 'равнина/луг', value: 'GRASSLAND' },
  { label: 'подземье', value: 'UNDERGROUND' },
  { label: 'город', value: 'CITY' },
  { label: 'деревня', value: 'VILLAGE' },
  { label: 'руины', value: 'RUINS' },
  { label: 'подземелья', value: 'DUNGEON' },
  { label: 'лес', value: 'FOREST' },
  { label: 'холмы', value: 'HILL' },
  { label: 'горы', value: 'MOUNTAIN' },
  { label: 'болото', value: 'SWAMP' },
  { label: 'пустыня', value: 'DESERT' },
  { label: 'тропики', value: 'TROPICS' },
];

/** Кость хитов по размеру: грань и среднее значение. */
export const CREATURE_HIT_DICE: Readonly<
  Record<string, { dice: string; average: number }>
> = {
  TINY: { dice: 'd4', average: 2.5 },
  SMALL: { dice: 'd6', average: 3.5 },
  MEDIUM: { dice: 'd8', average: 4.5 },
  LARGE: { dice: 'd10', average: 5.5 },
  HUGE: { dice: 'd12', average: 6.5 },
  GARGANTUAN: { dice: 'd20', average: 10.5 },
  SMALL_MEDIUM: { dice: 'd8', average: 4.5 },
};

/** Количество костей хитов в формуле карточки: `2к8`, `2d8 + 4`. */
export const CREATURE_HIT_FORMULA = /^(\d+)[dк]\d+/;

/** Характеристики: поле формы, код бэкенда и названия в карточке. */
export const CREATURE_ABILITIES = [
  { key: 'str', label: 'Сила', short: 'Сил', value: 'STRENGTH' },
  { key: 'dex', label: 'Ловкость', short: 'Лов', value: 'DEXTERITY' },
  { key: 'con', label: 'Телосложение', short: 'Тел', value: 'CONSTITUTION' },
  { key: 'int', label: 'Интеллект', short: 'Инт', value: 'INTELLIGENCE' },
  { key: 'wiz', label: 'Мудрость', short: 'Мдр', value: 'WISDOM' },
  { key: 'cha', label: 'Харизма', short: 'Хар', value: 'CHARISMA' },
] as const;

/** Скорости: так бэкенд подписывает их в карточке и ждёт при сохранении. */
export const CREATURE_SPEED_NAME = {
  fly: 'летая',
  swim: 'плавая',
  climb: 'лазая',
  dig: 'копая',
} as const;

/** Пометка парящего полёта. */
export const CREATURE_HOVER = 'парит';

/** Чувства: так бэкенд подписывает их в карточке и ждёт при сохранении. */
export const CREATURE_SENSE_NAME = {
  darkvision: 'тёмное зрение',
  truesight: 'истинное зрение',
  blindsight: 'слепое зрение',
  tremorsense: 'чувство вибрации',
} as const;

/** Пометка слепоты за пределами слепого зрения. */
export const CREATURE_BLIND_BEYOND = 'слеп за пределами этого радиуса';

/** Разделитель вариантов мировоззрения в карточке: «злой / нейтральный». */
export const CREATURE_ALIGNMENT_SEPARATOR = '/';

/** Значения нового существа, как в старом SPA. */
export const CREATURE_DEFAULT = {
  size: 'MEDIUM',
  type: 'HUMANOID',
  alignment: 'WITHOUT',
  armorClass: 10,
  ability: 10,
  speed: 30,
  challengeRating: '0',
  passivePerception: '10',
  legendaryCount: 3,
} as const;

/** Пределы значений характеристик. */
export const CREATURE_ABILITY_LIMIT = { min: 1, max: 30 } as const;

/** Наибольший класс доспеха: бэкенд хранит его байтом. */
export const CREATURE_BYTE_MAX = 127;

/** Подписи редактора существ. */
export const CREATURE_EDITOR_TEXT = {
  createTitle: 'Создание существа',
  editTitle: 'Редактирование существа',
  size: 'Размер',
  alignment: 'Мировоззрение',
  challengeRating: 'Уровень опасности',
  armorClass: 'Класс доспеха',
  armorText: 'Текст КД',
  armors: 'Доспехи',
  hitsTitle: 'Хиты',
  diceCount: 'Количество костей',
  average: 'Среднее',
  formula: 'Формула',
  hitText: 'Текст хитов',
  speedTitle: 'Скорость (в футах)',
  speed: 'Ходьба',
  fly: 'Полёт',
  swim: 'Плавание',
  climb: 'Лазание',
  dig: 'Копание',
  hover: 'Парит',
  abilitiesTitle: 'Характеристики',
  sensesTitle: 'Чувства (дистанции в футах)',
  passivePerception: 'Пассивная внимательность',
  darkvision: 'Тёмное зрение',
  truesight: 'Истинное зрение',
  blindsight: 'Слепое зрение',
  tremorsense: 'Чувство вибрации',
  blindBeyond: 'Слеп за пределами радиуса',
  languages: 'Языки через запятую',
  language: 'Языки свободным текстом',
  languagePlaceholder: 'Например: понимает Общий, но не говорит',
  tags: 'Теги через запятую',
  damageResistances: 'Сопротивления',
  damageImmunities: 'Иммунитеты к урону',
  damageVulnerabilities: 'Уязвимости',
  conditionImmunities: 'Иммунитеты к состояниям',
  environment: 'Среда обитания',
  reaction: 'Свободный текст реакций',
  legendaryDescription: 'Описание легендарных действий',
  npc: 'Именованный НИП',
  npcHelp:
    'Карточка не сообщает этот признак: отметьте его заново при правке НИП',
  empty: '—',
  created: 'Существо создано',
  saved: 'Существо обновлено',
  saveError: 'Не удалось сохранить существо',
} as const;

/** Подписи спасбросков и навыков. */
export const CREATURE_BONUS_TEXT = {
  savingThrows: 'Спасброски',
  skills: 'Навыки',
  ability: 'Характеристика',
  skill: 'Навык',
  value: 'Бонус',
  additional: 'Доп. текст',
  add: 'Добавить',
  remove: 'Удалить',
  emptySavingThrows: 'Нет спасбросков',
  emptySkills: 'Нет навыков',
} as const;

/** Подписи блоков действий. */
export const CREATURE_BLOCK_TEXT = {
  feats: 'Особенности',
  actions: 'Действия',
  bonusActions: 'Бонусные действия',
  reactions: 'Реакции',
  legendary: 'Легендарные действия',
  mystical: 'Мистические действия',
  add: 'Добавить',
  remove: 'Удалить',
  markdown: 'Используется markdown',
  shared: 'Это действие используется несколькими существами:',
  empty: 'Нет блоков',
} as const;

/** Иконки списков редактора существ. */
export const CREATURE_LIST_ICON = {
  add: 'tabler:plus',
  remove: 'tabler:trash',
  shared: 'tabler:alert-triangle',
} as const;

/** Строки полей разметки в редакторе существ. */
export const CREATURE_ROWS = {
  description: 6,
  block: 4,
  short: 3,
} as const;

/** Списки особенностей и действий в порядке карточки; мистические — в конце формы. */
export const CREATURE_BLOCK_SECTIONS = [
  { field: 'feats', title: CREATURE_BLOCK_TEXT.feats },
  { field: 'actions', title: CREATURE_BLOCK_TEXT.actions },
  { field: 'bonusActions', title: CREATURE_BLOCK_TEXT.bonusActions },
  { field: 'reactions', title: CREATURE_BLOCK_TEXT.reactions },
] as const;
