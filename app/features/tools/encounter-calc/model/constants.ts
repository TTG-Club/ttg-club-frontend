import type {
  EncounterDifficulty,
  EncounterState,
  EncounterThresholds,
  GenerationDifficulty,
  ThresholdDifficulty,
} from './types';

/** Адрес страницы калькулятора. */
export const ENCOUNTER_CALC_ROUTE = '/tools/encounter-calc';

/** Название калькулятора: заголовок страницы и пункт меню. */
export const ENCOUNTER_CALC_TITLE = 'Калькулятор столкновений';

/** Иконка калькулятора в меню и на главной. */
export const ENCOUNTER_CALC_ICON = 'tabler:scale';

/** Описание страницы для поисковиков. */
export const ENCOUNTER_CALC_DESCRIPTION =
  'Калькулятор столкновений — оценка сложности боя для группы персонажей D&D 5e по правилам «Руководства мастера» 2014 года.';

/** Локаль, в которой показываются числа опыта (пробел между тысячами). */
export const NUMBER_LOCALE = 'ru-RU';

/** Ключ состояния калькулятора в localStorage. */
export const ENCOUNTER_STORAGE_KEY = 'tools:encounter-calc';

export const MIN_CHARACTER_LEVEL = 1;
export const MAX_CHARACTER_LEVEL = 20;

/** Сколько персонажей или существ одного вида можно задать одной строкой. */
export const MIN_ROW_COUNT = 1;
export const MAX_ROW_COUNT = 20;

/** Сколько строк группы и существ можно добавить. */
export const MAX_PARTY_ROWS = 20;
export const MAX_CREATURE_ROWS = 50;

/** Уровень персонажей в новой строке группы. */
export const DEFAULT_CHARACTER_LEVEL = 1;

/** Сколько персонажей в группе по умолчанию — типичная партия. */
export const DEFAULT_PARTY_SIZE = 4;

/** Начальное состояние: группа из четырёх персонажей 1 уровня, существ нет. */
export const DEFAULT_ENCOUNTER_STATE: EncounterState = {
  party: [
    {
      id: 'default',
      level: DEFAULT_CHARACTER_LEVEL,
      count: DEFAULT_PARTY_SIZE,
    },
  ],
  creatures: [],
};

/** Нулевые пороги: группы нет. */
export const EMPTY_THRESHOLDS: EncounterThresholds = {
  easy: 0,
  medium: 0,
  hard: 0,
  deadly: 0,
};

/** Сложности с порогами по возрастанию. */
export const THRESHOLD_DIFFICULTIES: ReadonlyArray<ThresholdDifficulty> = [
  'easy',
  'medium',
  'hard',
  'deadly',
];

/**
 * Пороги опыта одного персонажа по уровню — таблица «Пороги опыта по уровню
 * персонажа» из «Руководства мастера» 2014. Индекс массива — уровень минус
 * один.
 */
export const EXPERIENCE_THRESHOLDS_BY_LEVEL: ReadonlyArray<EncounterThresholds> =
  [
    { easy: 25, medium: 50, hard: 75, deadly: 100 },
    { easy: 50, medium: 100, hard: 150, deadly: 200 },
    { easy: 75, medium: 150, hard: 225, deadly: 400 },
    { easy: 125, medium: 250, hard: 375, deadly: 500 },
    { easy: 250, medium: 500, hard: 750, deadly: 1_100 },
    { easy: 300, medium: 600, hard: 900, deadly: 1_400 },
    { easy: 350, medium: 750, hard: 1_100, deadly: 1_700 },
    { easy: 450, medium: 900, hard: 1_400, deadly: 2_100 },
    { easy: 550, medium: 1_100, hard: 1_600, deadly: 2_400 },
    { easy: 600, medium: 1_200, hard: 1_900, deadly: 2_800 },
    { easy: 800, medium: 1_600, hard: 2_400, deadly: 3_600 },
    { easy: 1_000, medium: 2_000, hard: 3_000, deadly: 4_500 },
    { easy: 1_100, medium: 2_200, hard: 3_400, deadly: 5_100 },
    { easy: 1_250, medium: 2_500, hard: 3_800, deadly: 5_700 },
    { easy: 1_400, medium: 2_800, hard: 4_300, deadly: 6_400 },
    { easy: 1_600, medium: 3_200, hard: 4_800, deadly: 7_200 },
    { easy: 2_000, medium: 3_900, hard: 5_900, deadly: 8_800 },
    { easy: 2_100, medium: 4_200, hard: 6_300, deadly: 9_500 },
    { easy: 2_400, medium: 4_900, hard: 7_300, deadly: 10_900 },
    { easy: 2_800, medium: 5_700, hard: 8_500, deadly: 12_700 },
  ];

/**
 * Скорректированный опыт на день приключений для одного персонажа по уровню
 * («Руководство мастера» 2014). Индекс массива — уровень минус один.
 */
export const DAILY_EXPERIENCE_BY_LEVEL: ReadonlyArray<number> = [
  300, 600, 1_200, 1_700, 3_500, 4_000, 5_000, 6_000, 7_500, 9_000, 10_500,
  11_500, 13_500, 15_000, 18_000, 20_000, 25_000, 27_000, 30_000, 40_000,
];

/**
 * Шкала множителей опыта за число существ. Крайние значения нужны только
 * для поправки на размер группы: ×0,5 — одно существо против большой группы,
 * ×5 — пятнадцать и больше существ против маленькой.
 */
export const ENCOUNTER_MULTIPLIERS: ReadonlyArray<number> = [
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5,
];

/**
 * С какого числа существ начинается каждая ступень множителя: 1 — ×1,
 * 2 — ×1,5, 3–6 — ×2, 7–10 — ×2,5, 11–14 — ×3, 15 и больше — ×4. Индекс
 * ступени в шкале `ENCOUNTER_MULTIPLIERS` — индекс в этом массиве плюс один.
 */
export const MULTIPLIER_STEP_MIN_COUNTS: ReadonlyArray<number> = [
  1, 2, 3, 7, 11, 15,
];

/** Группа меньше трёх персонажей берёт следующий множитель шкалы. */
export const SMALL_PARTY_MAX_SIZE = 2;

/** Группа из шести персонажей и больше берёт предыдущий множитель шкалы. */
export const LARGE_PARTY_MIN_SIZE = 6;

/**
 * Опыт по уровню опасности. Список бестиария опыта не отдаёт, поэтому он
 * всегда берётся отсюда.
 */
export const EXPERIENCE_BY_CHALLENGE_RATING: Readonly<Record<string, number>> =
  {
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1_100,
    '5': 1_800,
    '6': 2_300,
    '7': 2_900,
    '8': 3_900,
    '9': 5_000,
    '10': 5_900,
    '11': 7_200,
    '12': 8_400,
    '13': 10_000,
    '14': 11_500,
    '15': 13_000,
    '16': 15_000,
    '17': 18_000,
    '18': 20_000,
    '19': 22_000,
    '20': 25_000,
    '21': 33_000,
    '22': 41_000,
    '23': 50_000,
    '24': 62_000,
    '25': 75_000,
    '26': 90_000,
    '27': 105_000,
    '28': 120_000,
    '29': 135_000,
    '30': 155_000,
  };

/** Подпись сложности столкновения. */
export const DIFFICULTY_LABEL: Readonly<Record<EncounterDifficulty, string>> = {
  none: 'Нет данных',
  trivial: 'Тривиальная',
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
  deadly: 'Смертельная',
};

/** Пояснение к сложности — что ждёт группу. */
export const DIFFICULTY_HINT: Readonly<Record<EncounterDifficulty, string>> = {
  none: 'Добавьте персонажей и существ, чтобы оценить столкновение.',
  trivial:
    'Опыт существ не дотягивает до порога лёгкой сложности — группа вряд ли это заметит.',
  easy: 'Ресурсы почти не тратятся и серьёзной опасности нет: персонажи потеряют немного хитов, победа практически гарантирована.',
  medium:
    'Будет пара страшных моментов. Скорее всего, обойдётся без потерь, но кому-то понадобится лечение.',
  hard: 'Бой может обернуться плохо: слабых персонажей могут вывести из строя, есть небольшой шанс чьей-то гибели.',
  deadly:
    'Бой может стать смертельным для одного или нескольких персонажей. Выжить помогут хорошая тактика и быстрая реакция — группа рискует проиграть.',
};

/** Цвет бейджа сложности (палитра Nuxt UI). */
export const DIFFICULTY_COLOR = {
  none: 'neutral',
  trivial: 'neutral',
  easy: 'success',
  medium: 'info',
  hard: 'warning',
  deadly: 'error',
} as const satisfies Readonly<Record<EncounterDifficulty, string>>;

/** Классы отрезков шкалы сложности: подложка и заполнение. */
export const SEGMENT_CLASSES = {
  trivial: { track: 'bg-inverted/10', fill: 'bg-inverted/40' },
  easy: { track: 'bg-success/15', fill: 'bg-success' },
  medium: { track: 'bg-info/15', fill: 'bg-info' },
  hard: { track: 'bg-warning/15', fill: 'bg-warning' },
} as const;

/** Подписи блока итога. */
export const SUMMARY_LABELS = {
  difficulty: 'Сложность',
  totalExperience: 'Опыт за победу',
  perCharacter: 'На персонажа',
  adjustedExperience: 'Скорректированный опыт',
  multiplier: 'множитель',
  dailyBudget: 'Бюджет дня приключений',
  multiplierHint:
    'Сложность считается по опыту с множителем за число существ, а группа получает обычный опыт.',
} as const;

/** Сложность, которую генератор берёт по умолчанию. */
export const DEFAULT_GENERATION_DIFFICULTY: GenerationDifficulty = 'medium';

/** Сложности, до которых умеет добирать генератор. */
export const GENERATION_DIFFICULTY_OPTIONS: Array<{
  value: GenerationDifficulty;
  label: string;
}> = THRESHOLD_DIFFICULTIES.map((difficulty) => ({
  value: difficulty,
  label: DIFFICULTY_LABEL[difficulty],
}));

/**
 * Верхняя граница смертельной сложности для генератора — доля её порога:
 * выше порога шкала не кончается, но бессмысленно собирать бой вдесятеро
 * сильнее.
 */
export const GENERATION_DEADLY_CAP_RATIO = 1.5;

/** Сколько попыток собрать столкновение делает генератор. */
export const GENERATION_ATTEMPTS = 40;

/** Шанс остановиться, когда опыт уже попал в нужную сложность. */
export const GENERATION_STOP_CHANCE = 0.35;

/** Шанс добавить ещё одну копию уже выбранного существа, а не новое. */
export const GENERATION_REPEAT_CHANCE = 0.6;

/** Сколько разных существ генератор кладёт в одно столкновение. */
export const GENERATION_MAX_KINDS = 3;

/**
 * Доля наибольшего допустимого опыта одного существа, от которой существо
 * годится в «главари» столкновения.
 */
export const GENERATION_LEADER_RATIO = 0.25;

/** Сколько существ генератор добавляет на одного персонажа (и сверху). */
export const GENERATION_CREATURES_PER_CHARACTER = 2;
export const GENERATION_MIN_CREATURES = 4;
export const GENERATION_MAX_CREATURES = 12;

/** Параметры фильтра бестиария, которыми генератор отбирает кандидатов. */
export const GENERATION_FILTER_PARAM = {
  challengeRating: 'challengeRating',
  environment: 'environment',
} as const;

/** Тексты уведомлений генератора. */
export const GENERATION_TEXT = {
  title: 'Генерация',
  hint: 'Добавит существ до выбранной сложности',
  difficulty: 'Сложность',
  environment: 'Среда обитания',
  environmentPlaceholder: 'Любая',
  clearEnvironment: 'Любая среда обитания',
  submit: 'Сгенерировать',
  budgetSpentTitle: 'Сложность уже достигнута',
  budgetSpentDescription:
    'Опыт добавленных существ уже выше выбранной сложности. Очистите список или выберите сложность выше.',
  notFoundTitle: 'Подходящих существ не нашлось',
  notFoundDescription: 'Попробуйте другую среду обитания или сложность.',
  errorTitle: 'Не удалось сгенерировать столкновение',
  errorDescription: 'Бестиарий не ответил. Попробуйте ещё раз.',
} as const;

/** Подписи блока группы. */
export const PARTY_LABELS = {
  title: 'Группа',
  characters: 'Персонажей',
  level: 'Уровень',
  empty: 'Добавьте персонажей группы.',
  add: 'Добавить',
  removeAria: 'Убрать строку группы',
} as const;

/** Подписи блока существ. */
export const CREATURE_LABELS = {
  title: 'Существа',
  search: 'Существо из бестиария',
  searchPlaceholder: 'Найти существо…',
  notFound: 'Ничего не найдено',
  searchHint: 'Начните вводить название существа',
  count: 'Количество',
  addAria: 'Добавить существо',
  countAria: 'Количество существ',
  removeAria: 'Убрать существо',
  clear: 'Очистить',
  challengeRating: 'ПО',
  experience: 'опыт',
  total: 'всего',
  emptyList:
    'Найдите существ в бестиарии или добавьте своего монстра с нужным уровнем опасности.',
} as const;

/** Название своего монстра, если мастер его не ввёл. */
export const CUSTOM_CREATURE_DEFAULT_NAME = 'Свой монстр';

/** Уровень опасности своего монстра в новой форме. */
export const CUSTOM_CREATURE_DEFAULT_CHALLENGE_RATING = '1';

/** Длина названия своего монстра — как у имени участника трекера. */
export const MAX_CUSTOM_CREATURE_NAME_LENGTH = 100;

/** Подписи формы своего монстра. */
export const CUSTOM_CREATURE_LABELS = {
  toggle: 'Свой монстр',
  name: 'Название',
  challengeRating: 'Уровень опасности',
  count: 'Количество',
  submitAria: 'Добавить своего монстра',
  badge: 'Свой',
  experienceUnit: 'опыта',
} as const;

/** Значение «новый трекер» в выборе, куда переносить существ. */
export const TRANSFER_NEW_TRACKER = 'new';

/** Подписи окна переноса существ в трекер инициативы. */
export const TRANSFER_LABELS = {
  button: 'В трекер',
  buttonAria: 'Перенести существ в трекер инициативы',
  title: 'Перенести в трекер инициативы',
  description:
    'Существа столкновения добавятся в трекер, и он откроется. Персонажей группы добавьте в трекере сами.',
  newTracker: 'Новый трекер',
  newTrackerDescription: 'Создать трекер и добавить существ в него',
  newTrackerLimit: 'Достигнут лимит трекеров — выберите существующий',
  anonymousLimit: 'Без регистрации доступен один трекер',
  activeTracker: 'Идёт бой — существам сразу бросится инициатива',
  preparingTracker: 'Подготовка боя',
  name: 'Название трекера',
  namePlaceholder: 'Новый бой',
  cancel: 'Отмена',
  submit: 'Перенести',
  loadError: 'Не удалось загрузить трекеры',
  errorTitle: 'Не удалось перенести существ',
  partialTitle: 'Перенесены не все существа',
  capacityTitle: 'В трекере не хватит места',
  customSkippedTitle: 'Свои монстры не перенесутся',
  customSkippedDescription:
    'Трекер добавляет существ только из бестиария. Перенесутся остальные существа.',
} as const;
