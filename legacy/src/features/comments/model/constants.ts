/**
 * Путь сервиса комментариев внутри его базового URL (см.
 * `getCommentsBaseUrl`). Полный адрес в dev — `/comments/api/v1/comments`,
 * в prod — `/api/v1/comments` через шлюз.
 */
export const COMMENTS_API_PATH = '/comments';

/**
 * Разделы сайта, где включены комментарии: префикс маршрута деталки — имя
 * раздела в сервисе. Префикс не всегда односегментный (`/items/magic`),
 * поэтому это карта, а не список первых сегментов пути.
 *
 * Ключи проверяются от длинного к короткому, поэтому `/items/magic` не
 * перехватывается разделом `/items` (см. `getCommentsTarget`).
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
 * Размер выборки для свёрнутого превью (откат, когда недоступен `/latest`).
 * Не один корень: сверху ленты могут стоять надгробия удалённых, из которых
 * превью не собрать, — из небольшой выборки берётся первый живой.
 */
export const COMMENTS_PREVIEW_PAGE_SIZE = 3;

/** Сортировка корней: свежие обсуждения сверху. */
export const COMMENTS_ROOT_SORT = 'createdAt,desc';

/**
 * Локальная пауза между отправками после успешного комментария (секунды) —
 * зеркало антиспам-лимита сервиса, чтобы пользователь не упирался в 429.
 * Отказ 429 ставит паузу уже по `retryAfterSeconds` из ответа.
 */
export const COMMENT_SUBMIT_COOLDOWN_SECONDS = 20;

/** Максимальная длина текста комментария (сервер ввод не валидирует — только фронт). */
export const COMMENT_CONTENT_MAX_LENGTH = 3000;

/** Ограничение сервиса на длину раздела (`section`). */
export const COMMENT_SECTION_MAX_LENGTH = 100;

/** Ограничение сервиса на длину URL страницы. */
export const COMMENT_URL_MAX_LENGTH = 255;

/**
 * Максимальная визуальная глубина ветки: глубже ответы рисуются «ровно»,
 * без нового отступа, но с подписью, кому отвечают.
 */
export const COMMENTS_MAX_VISUAL_DEPTH = 3;

/**
 * Предохранитель рекурсивной догрузки ответов: сервис не ограничивает глубину
 * ветки, фронт за один раз не уходит глубже этого числа уровней — хвост
 * догружается кнопкой «Показать ответы» уже внутри ветки.
 */
export const COMMENTS_REPLIES_DEPTH_LIMIT = 20;

/** Префикс DOM-якоря комментария (`#comment-<id>`). */
export const COMMENT_ANCHOR_PREFIX = 'comment-';

/** Сколько держится подсветка комментария, открытого по якорю (мс). */
export const COMMENT_HIGHLIGHT_DURATION_MS = 2000;

/** Формат даты и времени комментария. */
export const COMMENT_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

/** Заголовок блока комментариев. */
export const COMMENTS_SECTION_TITLE = 'Комментарии';

/** Подпись кнопки повторной попытки после ошибки загрузки. */
export const COMMENTS_RETRY_LABEL = 'Попробовать снова';

/** Подпись кнопки догрузки следующей страницы. */
export const COMMENTS_LOAD_MORE_LABEL = 'Показать ещё';

/** Подпись «это ответ», когда сервис прислал имя автора родителя. */
export const COMMENT_REPLY_TO_PREFIX = 'в ответ';

// Подписи карточки комментария.

/**
 * Текст заглушки на месте удалённого комментария, который держит видимой
 * ветку своих ответов («надгробие»).
 */
export const COMMENT_TOMBSTONE_TEXT = 'Комментарий удалён';

/** Бейдж на своём комментарии. */
export const COMMENT_OWN_BADGE_LABEL = 'Вы';

/** Пометка отредактированного комментария. */
export const COMMENT_EDITED_MARK = '(изменено)';

/** Доступное имя меню действий (у кнопки только иконка). */
export const COMMENT_ACTIONS_MENU_LABEL = 'Действия с комментарием';

/** Подпись действия «скопировать якорную ссылку». */
export const COMMENT_COPY_LINK_LABEL = 'Скопировать ссылку';

/** Тост успешного копирования ссылки. */
export const COMMENT_COPY_LINK_SUCCESS_TOAST = 'Ссылка скопирована';

/** Тост неудачного копирования ссылки. */
export const COMMENT_COPY_LINK_ERROR_TOAST = 'Не удалось скопировать ссылку';

/** Подпись действия «перейти к родительскому комментарию». */
export const COMMENT_SHOW_PARENT_LABEL = 'Показать родительский';

/** Подпись действия «редактировать». */
export const COMMENT_EDIT_LABEL = 'Редактировать';

/** Подпись действия «удалить» в меню карточки. */
export const COMMENT_DELETE_MENU_LABEL = 'Удалить';

/** Подпись действия «пожаловаться». */
export const COMMENT_REPORT_LABEL = 'Пожаловаться';

/** Подпись действия, когда жалоба уже отправлена (кнопка погашена). */
export const COMMENT_REPORTED_LABEL = 'Жалоба отправлена';

/** Подпись кнопки ответа и кнопки отправки формы ответа. */
export const COMMENT_REPLY_LABEL = 'Ответить';

/** Начало подсказки в форме ответа — дальше идёт имя автора. */
export const COMMENT_REPLY_PLACEHOLDER_PREFIX = 'Ответ для';

/** Подсказка в форме правки. */
export const COMMENT_EDIT_PLACEHOLDER = 'Текст комментария';

/** Подпись кнопки отправки формы правки. */
export const COMMENT_EDIT_SUBMIT_LABEL = 'Сохранить';

/** Подпись кнопки, сворачивающей загруженную ветку. */
export const COMMENT_REPLIES_HIDE_LABEL = 'Скрыть ответы';

/** Подпись кнопки ветки, пока число ответов неизвестно. */
export const COMMENT_REPLIES_SHOW_LABEL = 'Показать ответы';

/** Доступное имя линии ветки — клик по ней сворачивает ответы. */
export const COMMENT_THREAD_COLLAPSE_LABEL = 'Свернуть ответы';

// Подписи блока комментариев и формы отправки.

/** Подсказка формы по умолчанию (корневой комментарий). */
export const COMMENT_COMPOSER_PLACEHOLDER = 'Написать комментарий…';

/** Подпись кнопки отправки формы по умолчанию. */
export const COMMENT_COMPOSER_SUBMIT_LABEL = 'Отправить';

/** Подпись кнопки отмены в формах ответа и правки. */
export const COMMENT_COMPOSER_CANCEL_LABEL = 'Отмена';

/**
 * Сокращение «секунд» в отсчёте на кнопке отправки во время антиспам-паузы
 * («Отправить · 12 с»).
 */
export const COMMENT_COOLDOWN_SECONDS_UNIT = 'с';

/** Подсказка формы нового обсуждения под лентой. */
export const COMMENT_COMPOSER_ROOT_PLACEHOLDER = 'Поделитесь мнением…';

/** Подпись, когда у страницы нет ни одного комментария. */
export const COMMENTS_EMPTY_MESSAGE =
  'Пока нет комментариев — начните обсуждение первым.';

/** Начало подписи кнопки разворачивания — дальше идёт число комментариев. */
export const COMMENTS_EXPAND_PREFIX = 'Показать';

/** Подпись кнопки разворачивания, когда комментариев ещё нет. */
export const COMMENTS_EXPAND_EMPTY_LABEL = 'Написать комментарий';

/**
 * То же у гостя: разворачивать нечего (лента пуста), а писать можно только
 * после входа — обещать «написать» тому, кому это недоступно, нельзя.
 */
export const COMMENTS_EXPAND_EMPTY_GUEST_LABEL = 'Войти, чтобы написать';

/**
 * Приглашение войти — стоит на месте формы отправки у гостя. Одной строкой:
 * блок висит под уже прочитанной лентой, читателю и так видно, что чтение
 * открыто, а лишний абзац только раздувал полосу.
 */
export const COMMENTS_LOGIN_NOTE_TEXT = 'Войдите, чтобы оставить комментарий';

/** Подпись кнопки входа в приглашении. */
export const COMMENTS_LOGIN_NOTE_BUTTON_LABEL = 'Войти';

/** Заголовок окна авторизации, открытого из блока комментариев. */
export const COMMENTS_AUTH_LOGIN_TITLE = 'Авторизация';

/** Заголовок окна регистрации, открытого из блока комментариев. */
export const COMMENTS_AUTH_REGISTRATION_TITLE = 'Регистрация';

/** Заголовок окна восстановления пароля, открытого из блока комментариев. */
export const COMMENTS_AUTH_CHANGE_PASSWORD_TITLE = 'Восстановление пароля';

/**
 * Подпись свёрнутого блока, когда обсуждение есть, а превью не собрать:
 * сверху ленты могут стоять надгробия, из которых карточку не сделать.
 */
export const COMMENTS_PREVIEW_UNAVAILABLE =
  'Откройте обсуждение, чтобы прочитать комментарии.';

// Тосты ленты комментариев.

/** Тост и заголовок ошибки загрузки списка комментариев. */
export const COMMENTS_LOAD_ERROR_TOAST = 'Не удалось загрузить комментарии';

/** Ошибка догрузки ветки ответов. */
export const COMMENT_REPLIES_LOAD_ERROR_TOAST = 'Не удалось загрузить ответы';

/** Ошибка отправки корневого комментария. */
export const COMMENT_SUBMIT_ERROR_TOAST = 'Не удалось отправить комментарий';

/** Ошибка отправки ответа. */
export const COMMENT_REPLY_ERROR_TOAST = 'Не удалось отправить ответ';

/** Заголовок ошибки правки, когда комментарий успели удалить (409). */
export const COMMENT_ALREADY_DELETED_TOAST = 'Комментарий уже удалён';

/** Ошибка сохранения правки. */
export const COMMENT_EDIT_ERROR_TOAST = 'Не удалось сохранить изменения';

/** Тост принятой жалобы. */
export const COMMENT_REPORT_SUCCESS_TOAST = 'Жалоба отправлена';

/** Пояснение к тосту принятой жалобы. */
export const COMMENT_REPORT_SUCCESS_DESCRIPTION =
  'Спасибо! Модераторы посмотрят на этот комментарий.';

/** Тост повторной жалобы (409 — уже жаловались). */
export const COMMENT_REPORT_DUPLICATE_TOAST = 'Жалоба уже учтена';

/** Пояснение к тосту повторной жалобы. */
export const COMMENT_REPORT_DUPLICATE_DESCRIPTION =
  'На этот комментарий вы уже жаловались.';

/** Ошибка отправки жалобы. */
export const COMMENT_REPORT_ERROR_TOAST = 'Не удалось отправить жалобу';

/** Тост неудачного удаления. */
export const COMMENT_DELETE_ERROR_TOAST = 'Не удалось удалить комментарий';

/** Заголовок диалога подтверждения удаления. */
export const COMMENT_DELETE_DIALOG_TITLE = 'Удалить комментарий?';

/** Подпись кнопки подтверждения в диалоге удаления. */
export const COMMENT_DELETE_CONFIRM_LABEL = 'Удалить';

/**
 * Предупреждение диалога удаления, когда у комментария есть ответы: сама
 * ветка остаётся видимой, вместо комментария в ней встаёт надгробие.
 */
export const COMMENT_DELETE_BRANCH_WARNING =
  'Текст будет скрыт, а ответы этой ветки останутся видны.';

/**
 * Предупреждение диалога удаления для комментария без ответов. Не «нельзя
 * отменить»: удаление мягкое, и модератор может восстановить комментарий.
 */
export const COMMENT_DELETE_IRREVERSIBLE_WARNING =
  'Комментарий исчезнет из обсуждения; вернуть его сможет только модератор.';

/** Доступное имя кнопки восстановления (у кнопки только иконка). */
export const COMMENT_RESTORE_LABEL = 'Восстановить комментарий';

/** Тост успешного восстановления. */
export const COMMENT_RESTORED_TOAST = 'Комментарий восстановлен';

/** Тост неудачного восстановления. */
export const COMMENT_RESTORE_ERROR_TOAST =
  'Не удалось восстановить комментарий';

/**
 * Тултип кнопки восстановления на надгробии: здесь важно объяснить, что текст
 * удалённого сервис в публичных выдачах не отдаёт вовсе и увидеть его можно
 * только так.
 */
export const COMMENT_RESTORE_FEED_TOOLTIP =
  'Восстановить — текст удалённого комментария виден только после этого';

/** Словоформы для счётчика ответов. */
export const COMMENT_REPLIES_PLURAL_FORMS: [string, string, string] = [
  'ответ',
  'ответа',
  'ответов',
];

/** Словоформы для счётчика комментариев. */
export const COMMENTS_PLURAL_FORMS: [string, string, string] = [
  'комментарий',
  'комментария',
  'комментариев',
];

/** Сообщение об ошибке, когда сервис не прислал текст. */
export const COMMENTS_UNKNOWN_ERROR_MESSAGE =
  'Не удалось выполнить действие. Попробуйте позже';
