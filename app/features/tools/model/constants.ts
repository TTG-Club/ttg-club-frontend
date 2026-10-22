/** Ручки генераторов: GET отдаёт варианты формы, POST — результат. */
export const TOOLS_API_URL = {
  madness: '/api/v1/tools/madness',
  wildMagic: '/api/v1/tools/wildmagic',
  encounters: '/api/v1/tools/encounters',
  encountersTable: '/api/v1/tools/encounters/table',
  names: '/api/v1/tools/names',
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

export const TOOLS_ICON = {
  generate: 'ttg:dice-d20',
  clear: 'tabler:trash',
  empty: 'tabler:sparkles',
  table: 'tabler:table',
} as const;
