import type { SelectOption } from './types';

import { ABILITIES } from '~tools/model';

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
  {
    key: 'feats',
    title: 'Черты',
    description: 'Создание и редактирование черт справочника.',
    referencePath: '/feats',
    icon: 'tabler:star',
  },
  {
    key: 'options',
    title: 'Особенности классов',
    description: 'Создание и редактирование особенностей классов справочника.',
    referencePath: '/options',
    icon: 'tabler:puzzle',
  },
  {
    key: 'backgrounds',
    title: 'Предыстории',
    description: 'Создание и редактирование предысторий справочника.',
    referencePath: '/backgrounds',
    icon: 'tabler:writing',
  },
  {
    key: 'weapons',
    title: 'Оружие',
    description: 'Создание и редактирование оружия справочника.',
    referencePath: '/weapons',
    icon: 'tabler:axe',
  },
  {
    key: 'armors',
    title: 'Доспехи',
    description: 'Создание и редактирование доспехов справочника.',
    referencePath: '/armors',
    icon: 'tabler:shield',
  },
  {
    key: 'items',
    title: 'Снаряжение',
    description: 'Создание и редактирование снаряжения справочника.',
    referencePath: '/items',
    icon: 'tabler:backpack',
  },
  {
    key: 'magic-items',
    title: 'Магические предметы',
    description: 'Создание и редактирование магических предметов справочника.',
    referencePath: '/items/magic',
    icon: 'tabler:diamond',
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

/** Сообщения проверки форм мастерской. */
export const WORKSHOP_VALIDATION = {
  required: 'Заполните поле',
  positive: 'Не меньше 1',
  notNegative: 'Не меньше 0',
  distance: 'Не меньше ближней дистанции',
  chooseOne: 'Выберите хотя бы одно значение',
} as const;

/** Так карточка показывает пустые требования черты или особенности. */
export const WORKSHOP_NO_REQUIREMENT = 'Нет';

/** Разделитель списков, которые форма принимает одной строкой. */
export const WORKSHOP_LIST_SEPARATOR = ',';

/** Склейка списков в одну строку для формы. */
export const WORKSHOP_LIST_JOINER = ', ';

/** Характеристики: код бэкенда и название. */
export const WORKSHOP_ABILITY_OPTIONS: ReadonlyArray<SelectOption> =
  ABILITIES.map(({ key, name }) => ({ label: name, value: key }));

/** Навыки: код бэкенда и название, как его показывает карточка. */
export const WORKSHOP_SKILL_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'Атлетика', value: 'ATHLETICS' },
  { label: 'Акробатика', value: 'ACROBATICS' },
  { label: 'Ловкость рук', value: 'SLEIGHT_OF_HAND' },
  { label: 'Скрытность', value: 'STEALTH' },
  { label: 'Магия', value: 'ARCANA' },
  { label: 'История', value: 'HISTORY' },
  { label: 'Анализ', value: 'INVESTIGATION' },
  { label: 'Природа', value: 'NATURE' },
  { label: 'Религия', value: 'RELIGION' },
  { label: 'Уход за животными', value: 'ANIMAL_HANDLING' },
  { label: 'Проницательность', value: 'INSIGHT' },
  { label: 'Медицина', value: 'MEDICINE' },
  { label: 'Внимательность', value: 'PERCEPTION' },
  { label: 'Выживание', value: 'SURVIVAL' },
  { label: 'Обман', value: 'DECEPTION' },
  { label: 'Запугивание', value: 'INTIMIDATION' },
  { label: 'Выступление', value: 'PERFORMANCE' },
  { label: 'Убеждение', value: 'PERSUASION' },
];

/** Подписи общих полей редакторов. */
export const WORKSHOP_FIELD_TEXT = {
  name: 'Название',
  englishName: 'Английское название',
  altName: 'Альтернативное название',
  level: 'Уровень',
  page: 'Страница',
  description: 'Описание',
  abilities: 'Характеристики',
  skills: 'Навыки',
  selectPlaceholder: 'Не выбрано',
  cost: 'Цена',
  currency: 'Валюта',
  weight: 'Вес',
  weightHelp: 'В фунтах',
  type: 'Тип',
} as const;

/** Монеты цены: код бэкенда и сокращение. */
export const WORKSHOP_CURRENCY_OPTIONS: ReadonlyArray<SelectOption> = [
  { label: 'мм', value: 'MM' },
  { label: 'см', value: 'SM' },
  { label: 'эм', value: 'EM' },
  { label: 'зм', value: 'GM' },
  { label: 'пм', value: 'PM' },
];

/** Монета цены новой записи. */
export const WORKSHOP_DEFAULT_CURRENCY = 'GM';

/** Шаг поля веса: вес бывает дробным. */
export const WORKSHOP_WEIGHT_STEP = 0.1;

/** Строки описания в редакторах. */
export const WORKSHOP_DESCRIPTION_ROWS = 12;
