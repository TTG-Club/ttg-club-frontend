/**
 * Имя хранилища кэша каталога. Само хранилище (в памяти, с вытеснением давно
 * не читанных ответов и сроком жизни записи) описано в `nitro.storage`
 * в `nuxt.config.ts`.
 */
export const CATALOG_CACHE_STORAGE = 'catalog-cache';

/** Начало адресов бэкенда, под которым лежат разделы. */
export const CATALOG_API_PREFIX = '/api/v1/';

/**
 * Разделы бэкенда, чтение которых кэшируется для гостей и меняется только
 * правкой редактора: списки и страницы записей, их фильтры (`filters`) и
 * мета-данные страниц (`meta`).
 */
export const CATALOG_CACHE_SECTIONS: readonly string[] = [
  'armors',
  'backgrounds',
  'bestiary',
  'books',
  'classes',
  'feats',
  'filters',
  'gods',
  'items',
  'meta',
  'options',
  'races',
  'rules',
  'screens',
  'spells',
  'traits',
  'treasures',
  'weapons',
];

/**
 * Методы, которыми читают каталог. Бэкенд отдаёт списки, записи и фильтры
 * по POST с параметрами в теле (страница, поиск, фильтры), а мета-данные
 * страниц — по GET.
 */
export const CATALOG_READ_METHODS: readonly string[] = ['GET', 'POST'];

/** Метод чтения, у которого параметры запроса лежат в теле. */
export const CATALOG_BODY_READ_METHOD = 'POST';

/** Методы, которые каталог заведомо не меняют. */
export const CATALOG_SAFE_METHODS: readonly string[] = ['GET', 'HEAD'];

/**
 * Последние куски адресов, которые шлют тело запроса, но каталог не меняют:
 * предпросмотр формы мастерской.
 */
export const CATALOG_READ_ONLY_ACTION_SEGMENTS: readonly string[] = ['preview'];

/**
 * Разделы бэкенда, запись в которые меняет каталог, хотя сами они в кэш не
 * попадают: мастерская (создание, правка, откат к прежней версии, картинки)
 * и заливка заклинаний и существ из JSON.
 */
export const CATALOG_CACHE_RESET_SECTIONS: readonly string[] = [
  'fcreature',
  'fspell',
  'workshop',
];

/** Заголовок ответа: взят ли ответ из кэша. Нужен для проверки и отладки. */
export const CATALOG_CACHE_STATE_HEADER = 'x-catalog-cache';

/** Заголовок с токеном посетителя. */
export const CATALOG_AUTHORIZATION_HEADER = 'authorization';

/** Заголовок типа содержимого. */
export const CATALOG_CONTENT_TYPE_HEADER = 'content-type';

/** Тип содержимого, если бэкенд его не прислал. */
export const CATALOG_DEFAULT_CONTENT_TYPE = 'application/json';

/**
 * Часть типа содержимого, без которой ответ в кэш не кладётся. На
 * неизвестный адрес бэкенд отвечает страницей SPA с кодом 200 — такой ответ
 * не должен прилипнуть к адресу каталога.
 */
export const CATALOG_CACHEABLE_CONTENT_TYPE = 'json';

/**
 * Заголовки посетителя, которые в запрос за общим ответом не передаются:
 * ответ обязан быть таким, каким его видит гость.
 */
export const CATALOG_PERSONAL_HEADERS: readonly string[] = [
  'authorization',
  'cookie',
];

/**
 * Заголовки, которые относятся к соединению посетителя с сайтом, а не к
 * запросу, и дальше не передаются (тот же список, что у прокси h3). Без
 * `accept-encoding` сжатие ответа выбирает сам сервер сайта, без
 * `content-length` длину тела считает `fetch`. Условные заголовки убраны,
 * чтобы бэкенд всегда присылал ответ целиком: пустой ответ «не изменилось»
 * в общий кэш класть нельзя.
 */
export const CATALOG_HOP_HEADERS: readonly string[] = [
  'accept',
  'accept-encoding',
  'connection',
  'content-length',
  'expect',
  'host',
  'if-modified-since',
  'if-none-match',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
];

/** Первый код ответа, который считается ошибкой. */
export const CATALOG_FIRST_ERROR_STATUS = 400;
