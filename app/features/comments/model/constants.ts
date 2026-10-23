/**
 * Базовый путь сервиса комментариев. Nitro отправляет его в
 * NITRO_COMMENTS_API_URL, а без него — в основной API.
 */
export const COMMENTS_API_PATH = '/api/v1/comments';

/** Платформа этого сайта в сервисе комментариев. */
export const COMMENTS_SOURCE_PLATFORM = 'SITE_5E14';

/** Статусы комментария на стороне сервиса. */
export const COMMENT_STATUSES = [
  'PUBLISHED',
  'DELETED',
  'PENDING_MODERATION',
  'REJECTED',
  'SPAM',
  'HIDDEN_BY_BAN',
] as const;

/**
 * Разделы с комментариями: префикс адреса записи и раздел в сервисе. Ключи
 * те же, что в старом SPA, иначе старые обсуждения потерялись бы.
 */
export const COMMENTS_ENABLED_SECTIONS: Readonly<Record<string, string>> = {
  '/armors': 'armors',
  '/backgrounds': 'backgrounds',
  '/bestiary': 'bestiary',
  '/books': 'books',
  '/classes': 'classes',
  '/feats': 'feats',
  '/gods': 'gods',
  '/items': 'items',
  '/items/magic': 'magic-items',
  '/options': 'options',
  '/races': 'races',
  '/rules': 'rules',
  '/screens': 'screens',
  '/spells': 'spells',
  '/weapons': 'weapons',
};

/** Размер страницы корневых комментариев. */
export const COMMENTS_PAGE_SIZE = 10;

/**
 * Выборка для свёрнутого превью, когда нет `/latest`. Не один корень: сверху
 * могут стоять надгробия, из которых превью не собрать.
 */
export const COMMENTS_PREVIEW_PAGE_SIZE = 3;

/** Сортировка корней: свежие сверху. */
export const COMMENTS_ROOT_SORT = 'createdAt,desc';

/**
 * Пауза между отправками после успешного комментария, в секундах: зеркало
 * антиспам-лимита сервиса, чтобы не упираться в 429.
 */
export const COMMENT_SUBMIT_COOLDOWN_SECONDS = 20;

/** Ключ общего состояния паузы между отправками. */
export const COMMENT_COOLDOWN_STATE_KEY = 'comments-submit-cooldown-until';

/** Длина текста комментария: сервер её не проверяет. */
export const COMMENT_CONTENT_MAX_LENGTH = 3000;

/** Ограничение сервиса на длину раздела. */
export const COMMENT_SECTION_MAX_LENGTH = 100;

/** Ограничение сервиса на длину адреса страницы. */
export const COMMENT_URL_MAX_LENGTH = 255;

/** Глубина, после которой ответы рисуются без нового отступа. */
export const COMMENTS_MAX_VISUAL_DEPTH = 3;

/**
 * Предохранитель рекурсивной догрузки: глубже хвост догружается кнопкой
 * внутри ветки.
 */
export const COMMENTS_REPLIES_DEPTH_LIMIT = 20;

/** Префикс якоря комментария (`#comment-<id>`). */
export const COMMENT_ANCHOR_PREFIX = 'comment-';

/** Сколько держится подсветка комментария, открытого по якорю. */
export const COMMENT_HIGHLIGHT_DURATION_MS = 2000;

/** Формат даты и времени комментария. */
export const COMMENT_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Через сколько часов относительное время сменяется датой. */
export const COMMENT_RELATIVE_TIME_HOURS = 24;

/** Язык относительного времени. */
export const COMMENT_TIME_LOCALE = 'ru';

/** Статусы ответов сервиса, которые лента разбирает отдельно. */
export const COMMENTS_HTTP_STATUS = {
  unauthorized: 401,
  notFound: 404,
  conflict: 409,
  tooManyRequests: 429,
} as const;

/** Словоформы счётчика комментариев. */
export const COMMENTS_PLURAL_FORMS = {
  one: 'комментарий',
  few: 'комментария',
  many: 'комментариев',
} as const;

/** Словоформы счётчика ответов. */
export const COMMENT_REPLIES_PLURAL_FORMS = {
  one: 'ответ',
  few: 'ответа',
  many: 'ответов',
} as const;

/** Подписи блока комментариев. */
export const COMMENTS_TEXT = {
  title: 'Комментарии',
  empty: 'Пока нет комментариев. Начните обсуждение первым.',
  previewUnavailable: 'Откройте обсуждение, чтобы прочитать комментарии.',
  expandPrefix: 'Показать',
  expandEmpty: 'Написать комментарий',
  expandEmptyGuest: 'Войти, чтобы написать',
  loadMore: 'Показать ещё',
  retry: 'Попробовать снова',
  loadError: 'Не удалось загрузить комментарии',
  loginNote: 'Войдите, чтобы оставить комментарий',
  loginButton: 'Войти',
  composerPlaceholder: 'Написать комментарий…',
  rootPlaceholder: 'Поделитесь мнением…',
  submit: 'Отправить',
  cancel: 'Отмена',
  cooldownUnit: 'с',
  unknownError: 'Не удалось выполнить действие. Попробуйте позже',
} as const;

/** Подписи карточки комментария. */
export const COMMENT_TEXT = {
  tombstone: 'Комментарий удалён',
  ownBadge: 'Вы',
  edited: '(изменено)',
  editedPrefix: 'Изменено',
  replyTo: 'в ответ',
  actionsMenu: 'Действия с комментарием',
  copyLink: 'Скопировать ссылку',
  linkCopied: 'Ссылка скопирована',
  copyError: 'Не удалось скопировать ссылку',
  showParent: 'Показать родительский',
  edit: 'Редактировать',
  editPlaceholder: 'Текст комментария',
  editSubmit: 'Сохранить',
  delete: 'Удалить',
  report: 'Пожаловаться',
  reported: 'Жалоба отправлена',
  reply: 'Ответить',
  replyPlaceholderPrefix: 'Ответ для',
  repliesHide: 'Скрыть ответы',
  repliesShow: 'Показать ответы',
  threadCollapse: 'Свернуть ответы',
  restore: 'Восстановить комментарий',
  restoreTooltip:
    'Восстановить: текст удалённого комментария виден только после этого',
  deleteTitle: 'Удалить комментарий?',
  deleteBranchWarning:
    'Текст будет скрыт, а ответы этой ветки останутся видны.',
  deleteWarning:
    'Комментарий исчезнет из обсуждения, вернуть его сможет только модератор.',
} as const;

/** Тосты действий с комментариями. */
export const COMMENT_TOAST = {
  repliesLoadError: 'Не удалось загрузить ответы',
  submitError: 'Не удалось отправить комментарий',
  replyError: 'Не удалось отправить ответ',
  alreadyDeleted: 'Комментарий уже удалён',
  editError: 'Не удалось сохранить изменения',
  reportSuccess: 'Жалоба отправлена',
  reportSuccessDescription:
    'Спасибо! Модераторы посмотрят на этот комментарий.',
  reportDuplicate: 'Жалоба уже учтена',
  reportDuplicateDescription: 'На этот комментарий вы уже жаловались.',
  reportError: 'Не удалось отправить жалобу',
  deleteError: 'Не удалось удалить комментарий',
  restored: 'Комментарий восстановлен',
  restoreError: 'Не удалось восстановить комментарий',
} as const;

/** Иконки блока комментариев. */
export const COMMENTS_ICON = {
  comments: 'tabler:message-circle',
  login: 'tabler:user',
  send: 'tabler:send-2',
  link: 'tabler:link',
  parent: 'tabler:corner-left-up',
  edit: 'tabler:pencil',
  delete: 'tabler:trash',
  report: 'tabler:flag',
  reply: 'tabler:arrow-back-up',
  restore: 'tabler:arrow-back-up',
  menu: 'tabler:dots-vertical',
  expand: 'tabler:chevron-down',
  collapse: 'tabler:chevron-up',
  error: 'tabler:alert-triangle',
  copied: 'tabler:copy-check',
} as const;
