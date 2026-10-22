/** Ручки генераторов: GET отдаёт варианты формы, POST — результат. */
export const TOOLS_API_URL = {
  madness: '/api/v1/tools/madness',
  wildMagic: '/api/v1/tools/wildmagic',
  encounters: '/api/v1/tools/encounters',
  encountersTable: '/api/v1/tools/encounters/table',
  names: '/api/v1/tools/names',
  trader: '/api/v1/tools/trader',
  treasury: '/api/v1/tools/treasury',
  // Таверна живёт на бэкенде вне `/api` и отдаёт HTML, см. `server/api/tools/tavern`
  tavern: '/api/tools/tavern',
} as const;

/** Сколько результатов можно получить за раз: больше бэкенд не отдаёт. */
export const TOOL_COUNT_MIN = 1;
export const TOOL_COUNT_MAX = 99;

/** Пауза между нажатиями «Сгенерировать», как в старом SPA. */
export const TOOL_GENERATE_THROTTLE_MS = 300;

/** Источник дикой магии, выбранный по умолчанию. */
export const WILD_MAGIC_DEFAULT_SOURCE = 'PHB';

export const TOOLS_TEXT = {
  generate: 'Сгенерировать',
  clear: 'Очистить',
  count: 'Количество',
  error: 'Не удалось получить результат, попробуйте ещё раз',
  optionsError: 'Не удалось загрузить настройки генератора',
  empty: 'Нажмите «Сгенерировать», чтобы получить результат',
} as const;

export const MADNESS_TEXT = {
  title: 'Безумие',
  types: 'Вид безумия',
  type: 'Тип:',
  duration: 'Длительность:',
} as const;

export const WILD_MAGIC_TEXT = {
  title: 'Дикая магия',
  sources: 'Источники',
} as const;

export const ENCOUNTERS_TEXT = {
  title: 'Случайные столкновения',
  level: 'Средний уровень группы',
  levelPlaceholder: 'Уровень',
  environment: 'Окружение',
  environmentPlaceholder: 'Окружение',
  source: 'Источник:',
  table: 'Таблица:',
  showTable: 'Показать таблицу',
  tableError: 'Таблица для этого уровня и окружения не найдена',
} as const;

export const NAMES_TEXT = {
  title: 'Генератор имён',
  type: 'Генерация',
  races: 'Раса',
  racesPlaceholder: 'Любая раса',
  components: 'Состав имени',
  sexes: 'Пол',
} as const;

/** Сколько имён генерировать для группы по умолчанию, как в старом SPA. */
export const NAME_COUNT_DEFAULT = 5;

/** Как генерировать: одно имя или группу с общей частью. */
export const NAME_GENERATION_TYPES = [
  { label: 'Один персонаж', value: 'SINGLE' },
  { label: 'Группа', value: 'GROUP' },
  { label: 'Семья', value: 'FAMILY' },
  { label: 'Клан', value: 'CLAN' },
  { label: 'Дом', value: 'HOUSE' },
] as const;

/** Части имени, из которых бэкенд собирает результат. */
export const NAME_COMPONENTS = [
  { label: 'Имя', value: 'NAME' },
  { label: 'Фамилия', value: 'SURNAME' },
  { label: 'Прозвище', value: 'NICKNAME' },
  { label: 'Клан', value: 'CLAN' },
  { label: 'Дом', value: 'HOUSE' },
  { label: 'Место', value: 'FROM' },
] as const;

export const NAME_SEXES = [
  { label: 'Мужчина', value: 'MALE' },
  { label: 'Женщина', value: 'FEMALE' },
  { label: 'Универсальные', value: 'UNISEX' },
] as const;

/** Подпись пола у готового имени. */
export const NAME_SEX_LABEL = {
  MALE: 'Мужское',
  FEMALE: 'Женское',
  UNISEX: 'Универсальное',
} as const;

/** Подсказка для генерации с общей частью имени: состав тогда задан. */
export const NAME_SHARED_HINT = {
  FAMILY: 'Для всех членов семьи будет использована одна фамилия.',
  CLAN: 'Для всех участников будет использован один клан.',
  HOUSE: 'Для всех участников будет использован один дом.',
} as const;

/** Отступ подрасы под своей расой в списке. */
export const NAME_RACE_CHILD_CLASS = 'ps-6';

export const ABILITY_CALC_TEXT = {
  title: 'Калькулятор характеристик',
  source: 'Калькулятор характеристик',
  race: 'Раса',
  racePlaceholder: 'Выбрать расу',
  subrace: 'Подраса',
  subracePlaceholder: 'Выбрать подрасу',
  split: 'Набор характеристик',
  splitPlaceholder: 'Выбрать набор',
  bonusPlaceholder: 'Выбери характеристику',
  bonuses: 'Бонусы расы',
  noRace: 'Раса не выбрана, бонусов нет',
  methods: 'Способ',
  sum: 'Сумма',
  roll: 'Бросить кубики',
  reroll: 'Перебросить',
  rollLabel: 'Бросок №',
  rolled: 'Выпало',
  points: 'Очков',
  reset: 'Сбросить',
  valuePlaceholder: 'Значение',
  ability: 'Характеристика',
  base: 'Значение',
  raceBonus: 'Бонус расы',
  total: 'Итого',
  modifier: 'Модификатор',
  empty: '—',
} as const;

/** Характеристики в порядке листа персонажа. */
export const ABILITIES = [
  { key: 'STRENGTH', name: 'Сила', short: 'сил' },
  { key: 'DEXTERITY', name: 'Ловкость', short: 'лов' },
  { key: 'CONSTITUTION', name: 'Телосложение', short: 'тел' },
  { key: 'INTELLIGENCE', name: 'Интеллект', short: 'инт' },
  { key: 'WISDOM', name: 'Мудрость', short: 'мдр' },
  { key: 'CHARISMA', name: 'Харизма', short: 'хар' },
] as const;

/** Способы получить значения характеристик. */
export const ABILITY_METHODS = [
  { label: 'Случайный набор', value: 'random' },
  { label: '«Покупка» значений', value: 'pointBuy' },
  { label: 'Стандартный набор', value: 'standard' },
] as const;

/** Бросок характеристики: 4к6, лучшие три. */
export const ABILITY_ROLL_FORMULA = '4к6kh3';

/** Стандартный набор из «Книги игрока». */
export const ABILITY_STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/** Сколько очков на «покупку» и что стоит каждое значение. */
export const POINT_BUY_MAX = 27;

export const POINT_BUY_MIN_SCORE = 8;

export const POINT_BUY_COST = [
  { value: 8, cost: 0 },
  { value: 9, cost: 1 },
  { value: 10, cost: 2 },
  { value: 11, cost: 3 },
  { value: 12, cost: 4 },
  { value: 13, cost: 5 },
  { value: 14, cost: 7 },
  { value: 15, cost: 9 },
] as const;

/** Склонения «очка» для подписей «покупки». */
export const POINTS_FORMS = {
  one: 'очко',
  few: 'очка',
  many: 'очков',
} as const;

/** Бонусы расы на выбор: ключи из ответа бэкенда. */
export const RACE_BONUS_TYPE = {
  one: 'ONE',
  choice: 'CHOICE',
  choiceUnique: 'CHOICE_UNIQUE',
  choiceDouble: 'CHOICE_DOUBLE',
} as const;

/** Как распределить бонус «+2 и +1 / +1 к трём». */
export const ABILITY_SPLITS = [
  { label: '+2 и +1', value: 'FOR_TWO' },
  { label: '+1 к трём', value: 'FOR_THREE' },
] as const;

/** Настройки вида добычи: общие у торговца и сокровищницы. */
export const LOOT_TEXT = {
  unique: 'Только уникальные',
  grouping: 'Группировать одинаковые',
  maxPrice: 'Отображать максимальную цену',
  countPrefix: '×',
  currency: 'зм',
} as const;

export const TRADER_TEXT = {
  title: 'Торговец',
  persuasion: 'Проверка харизмы (Убеждение)',
  magicLevel: 'Количество магии',
  priceSource: 'Источник цены',
  items: 'Товары',
  empty: 'Торговцу нечего предложить',
} as const;

/** Проверка Убеждения не ниже единицы, как в старом SPA. */
export const TRADER_PERSUASION_MIN = 1;

/** «Норма» магии у торговца по умолчанию. */
export const TRADER_MAGIC_LEVEL_DEFAULT = 1;

export const TREASURY_TEXT = {
  title: 'Сокровищница',
  cr: 'Показатель опасности монстров',
  contents: 'Состав',
  coins: 'Монеты',
  magicItems: 'Магические предметы',
  gems: 'Драгоценные камни',
  arts: 'Предметы искусства',
  trinkets: 'Безделушки',
  empty: 'Сокровищница пуста',
} as const;

/** Показатель опасности группами, как в таблицах сокровищ DMG. */
export const TREASURY_CR_ITEMS: ReadonlyArray<{
  label: string;
  value: number;
}> = [
  { label: '0–4', value: 1 },
  { label: '5–10', value: 2 },
  { label: '11–16', value: 3 },
  { label: '17+', value: 4 },
];

/** Показатель опасности по умолчанию: 0–4. */
export const TREASURY_CR_DEFAULT = 1;

/** Что положить в сокровищницу: поле запроса и подпись. */
export const TREASURY_KINDS = [
  { key: 'coins', label: 'Монеты' },
  { key: 'magicItem', label: 'Магические предметы' },
  { key: 'scroll', label: 'Свитки' },
  { key: 'trinket', label: 'Безделушки' },
  { key: 'art', label: 'Предметы искусства' },
  { key: 'gem', label: 'Драгоценные камни' },
] as const;

/** Сетка монет: все пять в ряд, когда хватает места. */
export const TREASURY_COINS_GRID_CLASS =
  'grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-5';

/** Монеты по возрастанию ценности и их сокращения. */
export const TREASURY_COINS = [
  { key: 'copper', unit: 'мм' },
  { key: 'silver', unit: 'см' },
  { key: 'electrum', unit: 'эм' },
  { key: 'gold', unit: 'зм' },
  { key: 'platinum', unit: 'пм' },
] as const;

export const TOOLS_ICON = {
  generate: 'ttg:dice-d20',
  clear: 'tabler:trash',
  empty: 'tabler:sparkles',
  table: 'tabler:table',
  reset: 'tabler:restore',
  reroll: 'tabler:refresh',
} as const;

export const TAVERN_TEXT = {
  title: 'Таверна',
  type: 'Тип заведения',
  typePlaceholder: 'Случайный тип',
  habitat: 'Территория',
  habitatPlaceholder: 'Случайная территория',
  serviceLevel: 'Уровень обслуживания',
  serviceLevelPlaceholder: 'Случайный уровень',
  reroll: 'Обновить',
  rerollName: 'Обновить название',
} as const;

/** Типы заведений: подпись в списке и короткая метка на карточке. */
export const TAVERN_TYPES = [
  { value: 'BEER', label: 'Пивная, кабак, бар', short: 'Пивная / бар' },
  {
    value: 'INN',
    label: 'Постоялый двор, трактир, таверна',
    short: 'Постоялый двор / таверна',
  },
  { value: 'HOTEL', label: 'Гостиница, отель', short: 'Гостиница' },
  { value: 'CAFE', label: 'Кафе, кофейня, чайная', short: 'Кафе' },
  {
    value: 'RESTAURANT',
    label: 'Ресторан, трапезная, харчевня',
    short: 'Ресторан',
  },
  {
    value: 'GAMBLING_DEN',
    label: 'Игорный дом, казино, притон',
    short: 'Игорный дом',
  },
] as const;

/** Территории; значения совпадают с `HabitatType` бэкенда. */
export const TAVERN_HABITATS = [
  { value: 'FOREST', label: 'Лес' },
  { value: 'SWAMP', label: 'Болото' },
  { value: 'MOUNTAIN', label: 'Горы' },
  { value: 'HILL', label: 'Холмы' },
  { value: 'GRASSLAND', label: 'Равнина / луг' },
  { value: 'COAST', label: 'Побережье' },
  { value: 'ARCTIC', label: 'Полярная тундра' },
  { value: 'DESERT', label: 'Пустыня' },
  { value: 'TROPICS', label: 'Тропики' },
  { value: 'CITY', label: 'Город' },
  { value: 'VILLAGE', label: 'Деревня' },
  { value: 'RUINS', label: 'Руины' },
  { value: 'DUNGEON', label: 'Подземелья' },
  { value: 'UNDERGROUND', label: 'Подземье' },
  { value: 'WATERS', label: 'Под водой' },
] as const;

/** Уровни обслуживания; значения совпадают с `TavernaCategory` бэкенда. */
export const TAVERN_SERVICE_LEVELS = [
  { value: 'CHEAP', label: 'Дешёвое' },
  { value: 'ORDINARY', label: 'Обычное' },
  { value: 'EXPENSIVE', label: 'Дорогое' },
  { value: 'ELITE', label: 'Элитное' },
] as const;

/** Части таверны и их ручки; у атмосферы бэкенд ждёт слэш на конце. */
export const TAVERN_PATH = {
  name: 'name',
  menu: 'menu',
  atmosphere: 'atmosphere/',
  rumors: 'rumors',
  event: 'event',
  tables: 'tables',
  bartender: 'bartender',
} as const;

/** Блоки карточки под названием, по порядку. */
export const TAVERN_SECTIONS = [
  'menu',
  'atmosphere',
  'rumors',
  'event',
  'tables',
  'bartender',
] as const;

/** Заполненность зала в HTML атмосферы. */
export const TAVERN_VISITORS_PATTERN = /data-visitors="(\d+)"/;
