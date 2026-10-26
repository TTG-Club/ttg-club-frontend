/** API трекера: core-api, версия v2. */
export const INITIATIVE_API_URL = '/api/v2/tools/initiative';

/** Страница инструмента; трекер открывается по `/tools/initiative/<id>`. */
export const INITIATIVE_ROUTE = '/tools/initiative';

/** Страница существа в бестиарии. */
export const INITIATIVE_BESTIARY_ROUTE = '/bestiary';

/** Слот единственного трекера гостя, общий со старым SPA. */
export const INITIATIVE_SLOT_STORAGE_KEY = 'initiative:anon-slot';

/**
 * Хиты, их прокинутый максимум и КД игроков: на бэкенде этих полей нет, они
 * живут на устройстве ведущего. Ключи общие со старым SPA.
 */
export const PARTICIPANT_STAT_STORAGE_KEY = {
  hitPoints: 'initiative:hit-points',
  maxHitPoints: 'initiative:max-hit-points',
  armorClass: 'initiative:armor-class',
  temporaryHitPoints: 'initiative:temporary-hit-points',
} as const;

/** Заголовок с ключом доступа к трекеру гостя. */
export const TRACKER_KEY_HEADER = 'X-Tracker-Key';

/** Статусы, при которых ключ гостя считается потерянным. */
export const TRACKER_LOST_STATUSES: ReadonlyArray<number> = [401, 403, 404];

export const TRACKER_STATUSES = ['PREPARING', 'ACTIVE'] as const;

export const PARTICIPANT_TYPES = ['PLAYER', 'CREATURE'] as const;

/** Ограничения бэкенда и старого SPA. */
export const INITIATIVE_LIMIT = {
  trackers: 10,
  players: 50,
  creatures: 100,
  name: 100,
  bonusMin: -20,
  bonusMax: 30,
  rollMin: 1,
  rollMax: 20,
  batchMin: 1,
  armorClassMin: 1,
  armorClassMax: 50,
  /** КД игрока без брони, пока ведущий его не задал. */
  armorClassDefault: 10,
} as const;

/** Быстрые шаги урона и лечения в окне хитов. */
export const HIT_POINT_STEPS: ReadonlyArray<number> = [-5, -1, 1, 5];

/** Ввод хитов: `58` ставит значение, `+7` лечит, `-6` ранит. */
export const HIT_POINT_INPUT_PATTERN = /^([+-])?(\d+)$/;

/** Ввод временных хитов — только целое неотрицательное число. */
export const TEMPORARY_HIT_POINT_INPUT_PATTERN = /^\d+$/;

/** Лента ходов: шаг между токенами в пикселях и токенов по сторонам. */
export const TURN_REEL = {
  step: 96,
  window: 8,
} as const;

/** Поиск существ для добавления: сколько и через сколько миллисекунд. */
export const CREATURE_SEARCH = {
  size: 20,
  debounceMs: 300,
} as const;

export const INITIATIVE_TEXT = {
  title: 'Трекер инициативы',
  defaultName: 'Новый трекер',
  create: 'Собрать бой',
  createDescription:
    'Соберите игроков и существ, прокиньте инициативу и ведите бой по ходам.',
  guestHint: 'Без входа доступен один бой. Войдите, чтобы держать до десяти.',
  guestLoading: 'Готовим бой…',
  guestFailed: 'Не удалось начать бой',
  limit: 'Достигнут лимит боёв: удалите один, чтобы собрать новый.',
  yourTrackers: 'Ваши бои',
  empty: 'Здесь появятся собранные бои.',
  history: 'История',
  inHistory: 'В истории',
  round: 'Раунд',
  rename: 'Переименовать',
  renameTitle: 'Переименовать трекер',
  namePlaceholder: 'Название трекера',
  save: 'Сохранить',
  cancel: 'Отмена',
  remove: 'Удалить',
  removeTitle: 'Удалить трекер?',
  removeSoft: 'Трекер переедет в историю.',
  removeHard: 'Трекер удалится безвозвратно.',
  newGuestTracker: 'Новый бой',
  newGuestTitle: 'Начать новый бой?',
  newGuestDescription: 'Текущий бой удалится: без входа доступен только один.',
  actions: 'Действия',
  back: 'К списку боёв',
  signIn: 'Войти',
  retry: 'Обновить',
  authRequired: 'Войдите, чтобы увидеть свои бои',
  loadFailed: 'Не удалось загрузить',
  notFound: 'Трекер не найден',
  forbidden: 'Доступ к трекеру закрыт',
  rollAll: 'Прокинуть всем',
  rollCreatures: 'Существам',
  start: 'Начать бой',
  previous: 'Предыдущий ход',
  next: 'Следующий ход',
  reset: 'Завершить бой',
  resetTitle: 'Завершить бой?',
  resetDescription:
    'Броски очистятся, состав останется: трекер вернётся к подготовке.',
  addPlayer: 'Игрок',
  addCreature: 'Существо',
  playerName: 'Имя игрока',
  bonus: 'Бонус',
  initiative: 'Иниц.',
  creature: 'Существо',
  creaturePlaceholder: 'Начните вводить название',
  creatureEmpty: 'Ничего не найдено',
  count: 'Количество',
  nameOverride: 'Своё имя (необязательно)',
  add: 'Добавить',
  playersLimit: 'Игроков больше не добавить.',
  creaturesLimit: 'Существ больше не добавить.',
  noParticipants: 'Соберите отряд: добавьте игроков и существ бестиария.',
  challengeRating: 'ПО',
  roll: 'Бросить к20',
  reroll: 'Перебросить',
  advantage: 'Преимущество',
  disadvantage: 'Помеха',
  manualRoll: 'Своё к20',
  apply: 'Применить',
  kill: 'Повержен',
  revive: 'Вернуть в бой',
  removeParticipant: 'Убрать',
  openCreature: 'Статблок',
  participantName: 'Имя участника',
  unknownError: 'Неизвестная ошибка',
  errorCreate: 'Не удалось создать трекер',
  errorRename: 'Не удалось переименовать трекер',
  errorRemove: 'Не удалось удалить трекер',
  errorAdd: 'Не удалось добавить участника',
  errorEdit: 'Не удалось изменить участника',
  errorRoll: 'Не удалось прокинуть инициативу',
  errorTurn: 'Не удалось передать ход',
  errorReset: 'Не удалось завершить бой',
  errorNoKey: 'Сервер не вернул ключ доступа',
  hitPoints: 'Хиты',
  changeHitPoints: 'Изменить хиты',
  fullHitPoints: 'Полные хиты',
  rollHitPoints: 'Бросить хиты',
  hitPointsInput: 'Точное значение, + или −',
  hitPointsSource: 'Трекер инициативы',
  temporaryHitPoints: 'Временные хиты',
  temporaryHitPointsHint:
    'Новое значение заменит текущее, только если оно больше. Урон сначала снимает временные хиты.',
  temporaryHitPointsApply: 'Задать',
  clearTemporaryHitPoints: 'Снять временные хиты',
  ok: 'ОК',
  armorClass: 'КД',
  changeArmorClass: 'Изменить КД',
  currentTurn: 'Сейчас ходит',
} as const;

export const INITIATIVE_ICON = {
  create: 'tabler:swords',
  preparing: 'tabler:swords',
  active: 'tabler:flame',
  player: 'tabler:user',
  creature: 'tabler:paw',
  menu: 'tabler:dots-vertical',
  rename: 'tabler:pencil',
  remove: 'tabler:trash',
  back: 'tabler:arrow-left',
  history: 'tabler:history',
  rollAll: 'tabler:dice-5',
  start: 'tabler:swords',
  previous: 'tabler:arrow-big-left-lines',
  next: 'tabler:arrow-big-right-lines',
  reset: 'tabler:restore',
  roll: 'ttg:dice-d20',
  advantage: 'tabler:chevrons-up',
  disadvantage: 'tabler:chevrons-down',
  kill: 'tabler:skull',
  revive: 'tabler:heart',
  clearTemporaryHitPoints: 'tabler:shield-x',
  open: 'tabler:external-link',
  add: 'tabler:plus',
  loading: 'tabler:loader-2',
  signIn: 'tabler:user',
  newGuest: 'tabler:plus',
  minus: 'tabler:minus',
  heal: 'tabler:heart-plus',
} as const;

/** Подпись и иконка типа участника, если бэкенд не прислал `typeName`. */
export const PARTICIPANT_TYPE_META = {
  PLAYER: { label: 'Игрок', icon: INITIATIVE_ICON.player },
  CREATURE: { label: 'Существо', icon: INITIATIVE_ICON.creature },
} as const;

/** Оформление статуса трекера. */
export const TRACKER_STATUS_META = {
  PREPARING: { color: 'neutral', icon: INITIATIVE_ICON.preparing },
  ACTIVE: { color: 'success', icon: INITIATIVE_ICON.active },
} as const;

/** Формат даты последнего изменения трекера. */
export const TRACKER_DATE_FORMAT = 'D MMMM YYYY, HH:mm';

/** Язык названий месяцев в дате. */
export const TRACKER_DATE_LOCALE = 'ru';
