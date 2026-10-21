/** Ручка закладок пользователя. */
export const BOOKMARKS_PATH = '/api/v1/bookmarks';

/** Ручка категории закладки по адресу страницы. */
export const BOOKMARK_CATEGORY_PATH = '/api/v1/bookmarks/category';

/** Группа по умолчанию: в неё сохраняет кнопка закладки. */
export const DEFAULT_GROUP = { name: 'Общие', order: -1 } as const;

/** Ключ гостевых закладок в localStorage. */
export const LOCAL_BOOKMARKS_STORAGE_KEY = 'ttg-bookmarks';

/** Где старое SPA хранило гостевые закладки (localforage в IndexedDB). */
export const LEGACY_BOOKMARKS_DB = {
  name: 'dnd5club',
  store: 'bookmarks',
  key: 'default',
} as const;

/** Тексты закладок. */
export const BOOKMARKS_TEXT = {
  title: 'Закладки',
  empty: 'Здесь пока пусто',
  add: 'Добавить в закладки',
  remove: 'Удалить из закладок',
  removeItem: 'Удалить',
  added: 'Закладка добавлена',
  removed: 'Закладка удалена',
  error: 'Не удалось сохранить закладку',
  loadError: 'Не удалось загрузить закладки',
  groups: 'Группы',
  newGroup: 'Новая группа',
  addGroup: 'Добавить группу',
  rename: 'Переименовать',
  deleteGroup: 'Удалить группу',
  deleteGroupConfirm: 'Удалить группу вместе с закладками?',
  cancel: 'Отмена',
  save: 'Сохранить',
  guestHint: 'Войдите, чтобы раскладывать закладки по своим группам',
} as const;

/** Иконки закладок. */
export const BOOKMARKS_ICON = {
  outline: 'tabler:bookmark',
  filled: 'tabler:bookmark-filled',
  remove: 'tabler:x',
  add: 'tabler:plus',
  edit: 'tabler:pencil',
  delete: 'tabler:trash',
  more: 'tabler:chevron-down',
} as const;
