/** Ролики YouTube-канала: список, добавление, правка и удаление. */
export const YOUTUBE_API_PATH = '/api/v1/youtube';

/** Число роликов, которые сейчас показываются на главной. */
export const YOUTUBE_COUNT_PATH = `${YOUTUBE_API_PATH}/count`;

/** Включение и выключение показа ролика на главной. */
export const YOUTUBE_ACTIVE_PATH = `${YOUTUBE_API_PATH}/active`;

/** Адрес страницы админки роликов. */
export const ADMIN_YOUTUBE_ROUTE = '/admin/youtube';

/** Сколько роликов главная показывает одновременно. */
export const YOUTUBE_ACTIVE_LIMIT = 5;

/** Порядок списка: свежие сверху, при одной дате по названию. */
export const YOUTUBE_ORDER = 'created desc,name asc';

/** Варианты размера страницы, как в старом SPA. */
export const YOUTUBE_PAGE_SIZES: Array<number> = [9, 27, 54];

/** Размер страницы по умолчанию. */
export const YOUTUBE_DEFAULT_PAGE_SIZE = 9;

/** Длина названия ролика, которую принимает бэкенд. */
export const YOUTUBE_NAME_MAX_LENGTH = 1000;

/** Длина идентификатора ролика YouTube. */
export const YOUTUBE_ID_LENGTH = 11;

/**
 * Идентификатор ролика в ссылках YouTube: `watch?v=`, `youtu.be/`,
 * `shorts/`, `embed/` и `live/`.
 */
export const YOUTUBE_URL_ID_PATTERN =
  /(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})(?![\w-])/;

/** Голый идентификатор ролика. */
export const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

/** Формат даты добавления ролика. */
export const YOUTUBE_DATE_FORMAT = 'DD.MM.YYYY';

/** Подписи админки роликов. */
export const ADMIN_YOUTUBE_TEXT = {
  title: 'Видео на главной',
  description:
    'Ролики канала: на главной показываются отмеченные, свежие сверху.',
  menuLink: 'Видео на главной',
  guestTitle: 'Раздел доступен после входа',
  guestDescription: 'Войдите под аккаунтом модератора или администратора',
  signIn: 'Войти',
  forbiddenTitle: 'Нет доступа',
  forbiddenDescription:
    'Управлять роликами могут только модераторы и администраторы',
  pageSize: 'На странице',
  activeCount: 'На главной',
  activeCountSeparator: 'из',
  add: 'Новое видео',
  empty: 'Роликов пока нет',
  loadError: 'Не удалось загрузить ролики',
  retry: 'Попробовать снова',
  added: 'Добавлено',
  showOnHome: 'Показывать на главной',
  activeLimitReached: 'На главной уже максимум роликов',
  edit: 'Изменить',
  delete: 'Удалить',
  addTitle: 'Новое видео',
  editTitle: 'Изменить видео',
  idLabel: 'Ссылка или ID ролика',
  idHelp: 'Подойдёт ссылка с YouTube или 11 символов ID',
  idPlaceholder: 'https://youtu.be/…',
  nameLabel: 'Название',
  namePlaceholder: 'Как ролик будет подписан на главной',
  save: 'Сохранить',
  cancel: 'Отмена',
  deleteTitle: 'Удалить видео?',
  deleteDescription: 'Ролик пропадёт из списка и с главной.',
  addedToast: 'Видео добавлено',
  savedToast: 'Видео сохранено',
  deletedToast: 'Видео удалено',
  actionError: 'Не удалось выполнить действие',
} as const;

/** Сообщения проверки формы ролика. */
export const YOUTUBE_VALIDATION = {
  idRequired: 'Укажите ссылку или ID ролика',
  idInvalid: 'Не похоже на ссылку или ID ролика YouTube',
  nameRequired: 'Укажите название',
  nameTooLong: `Не более ${YOUTUBE_NAME_MAX_LENGTH} символов`,
} as const;

/** Иконки админки роликов. */
export const ADMIN_YOUTUBE_ICON = {
  page: 'tabler:brand-youtube',
  add: 'tabler:plus',
  edit: 'tabler:pencil',
  delete: 'tabler:trash',
  guest: 'tabler:lock',
  forbidden: 'tabler:shield-lock',
  error: 'tabler:alert-triangle',
  empty: 'tabler:video-off',
  success: 'tabler:check',
} as const;
