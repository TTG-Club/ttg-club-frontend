/** Ручки генераторов: GET отдаёт варианты формы, POST — результат. */
export const TOOLS_API_URL = {
  madness: '/api/v1/tools/madness',
  wildMagic: '/api/v1/tools/wildmagic',
  encounters: '/api/v1/tools/encounters',
  encountersTable: '/api/v1/tools/encounters/table',
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

export const TOOLS_ICON = {
  generate: 'ttg:dice-d20',
  clear: 'tabler:trash',
  empty: 'tabler:sparkles',
  table: 'tabler:table',
} as const;
