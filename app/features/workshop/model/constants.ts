/** Адрес мастерской. */
export const WORKSHOP_ROUTE = '/workshop';

/** Ручки мастерской: создание, правка и ревизии записей. */
export const WORKSHOP_API_PATH = '/api/v1/workshop';

/** Префикс ручек справочника: запись читается по адресу её страницы. */
export const REFERENCE_API_PATH = '/api/v1';

/** Окончание адреса страницы правки. */
export const WORKSHOP_EDIT_SUFFIX = '/edit';

/** Окончание адреса страницы создания. */
export const WORKSHOP_CREATE_SUFFIX = '/create';

/** Книги для выбора источника. */
export const WORKSHOP_BOOKS_PATH = '/api/v1/books';

/** Запрос всех книг по алфавиту, как в старом SPA. */
export const WORKSHOP_BOOKS_QUERY = {
  page: 0,
  size: -1,
  order: [{ field: 'name', direction: 'asc' }],
} as const;

/** Пробелы в английском названии, которые в адресе записи становятся `_`. */
export const WORKSHOP_SLUG_SPACES = /\s+/g;

export const WORKSHOP_SLUG_SEPARATOR = '_';

/** Раздел мастерской: тип записей, которые в нём правятся. */
export interface WorkshopSection {
  /** Ключ раздела: он же сегмент адреса и ручки мастерской. */
  key: string;
  title: string;
  description: string;
  /** Раздел справочника, где выбирается запись для правки. */
  referencePath: string;
  icon: string;
}

/** Разделы мастерской в порядке старого SPA. */
export const WORKSHOP_SECTIONS: ReadonlyArray<WorkshopSection> = [
  {
    key: 'spells',
    title: 'Заклинания',
    description: 'Создание и редактирование заклинаний справочника.',
    referencePath: '/spells',
    icon: 'tabler:wand',
  },
];

/** Подписи мастерской. */
export const WORKSHOP_TEXT = {
  title: 'Мастерская',
  description:
    'Создание и правка записей справочника. Запись для правки выбирается в её разделе: у редакторов там есть кнопка правки.',
  guestTitle: 'Мастерская доступна после входа',
  guestDescription: 'Войдите под аккаунтом модератора или администратора',
  signIn: 'Войти',
  forbiddenTitle: 'Нет доступа',
  forbiddenDescription:
    'Править справочник могут только модераторы и администраторы',
  create: 'Добавить',
  openReference: 'Открыть справочник',
  sectionHint:
    'Чтобы изменить запись, откройте её в справочнике и нажмите кнопку правки.',
  save: 'Сохранить',
  createSubmit: 'Создать',
  cancel: 'Отмена',
  loadError: 'Не удалось загрузить запись',
  retry: 'Попробовать снова',
  notFound: 'Запись не найдена',
  saveError: 'Не удалось сохранить',
  source: 'Источник',
  sourcePlaceholder: 'Homebrew (по умолчанию)',
  sourceHelp:
    'Без источника новая запись попадёт в самодельный контент, а у существующей источник не изменится.',
} as const;

/** Иконки мастерской. */
export const WORKSHOP_ICON = {
  page: 'tabler:tools',
  create: 'tabler:plus',
  reference: 'tabler:book-2',
  save: 'tabler:device-floppy',
  guest: 'tabler:lock',
  forbidden: 'tabler:shield-lock',
  error: 'tabler:alert-triangle',
  success: 'tabler:check',
  back: 'tabler:arrow-left',
} as const;

/** Операции ревизий. */
export enum RevisionOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/** Подписи операций ревизий. */
export const REVISION_OPERATION_LABELS: Record<RevisionOperation, string> = {
  [RevisionOperation.CREATE]: 'Создание',
  [RevisionOperation.UPDATE]: 'Изменение',
  [RevisionOperation.DELETE]: 'Удаление',
};

/** Цвета значков операций. */
export const REVISION_OPERATION_COLORS = {
  [RevisionOperation.CREATE]: 'success',
  [RevisionOperation.UPDATE]: 'neutral',
  [RevisionOperation.DELETE]: 'error',
} as const;

/** Формат даты ревизии. */
export const REVISION_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

/** Подписи истории изменений. */
export const REVISION_TEXT = {
  title: 'История изменений',
  empty: 'Ревизий пока нет',
  loadError: 'Не удалось загрузить историю',
  retry: 'Попробовать снова',
  restore: 'Восстановить',
  restoreTitle: 'Восстановление из ревизии',
  restoreDescription: 'Заменить текущее состояние данными ревизии №',
  restoreConfirm: 'Восстановить',
  cancel: 'Отмена',
  restored: 'Восстановлено из ревизии',
  restoreError: 'Не удалось восстановить',
  numberPrefix: '№',
} as const;

/** Иконки истории изменений. */
export const REVISION_ICON = {
  title: 'tabler:history',
  restore: 'tabler:restore',
  empty: 'tabler:history-off',
} as const;
