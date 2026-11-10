/** Ручки картинок мастерской: загрузка в S3, галереи и обложки. */
export const WORKSHOP_IMAGES_API_PATH = '/api/v1/workshop/images';

/** Последний сегмент ручки обложки: `/api/v1/workshop/images/CLASS/1/cover`. */
export const WORKSHOP_IMAGES_COVER_SEGMENT = 'cover';

/**
 * Раздел записи, к которой привязана картинка: значения совпадают с
 * `ImageType` бэкенда.
 */
export enum WorkshopImageType {
  CLASS = 'CLASS',
  SUBCLASS = 'SUBCLASS',
  RACE = 'RACE',
  CREATURE = 'CREATURE',
  GOD = 'GOD',
  ITEM = 'ITEM',
  MAGIC_ITEM = 'MAGIC_ITEM',
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
}

/** Разделы, у записей которых есть обложка карточки. */
export const WORKSHOP_COVER_IMAGE_TYPES: ReadonlySet<WorkshopImageType> =
  new Set([WorkshopImageType.CLASS, WorkshopImageType.RACE]);

/** Ограничения загрузки: бэкенд проверяет то же самое. */
export const WORKSHOP_IMAGE_LIMIT = {
  /** Предел размера файла, байт. */
  maxBytes: 10 * 1024 * 1024,
  /** Предел картинок в галерее. */
  maxGallery: 50,
} as const;

/** Типы файлов в диалоге выбора. */
export const WORKSHOP_IMAGE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/bmp';

/** Подписи блока картинок. */
export const WORKSHOP_IMAGE_TEXT = {
  title: 'Картинки',
  description:
    'Файлы перекодируются в WebP и уменьшаются до 2048 пикселей по большей стороне. Изменения сохраняются сразу.',
  coverTitle: 'Обложка карточки',
  coverDescription:
    'Картинка в списке раздела. Новый файл заменяет прежнюю обложку.',
  coverInherited:
    'У разновидности своей обложки нет: показывается обложка основной расы.',
  coverMissing: 'Обложки пока нет',
  uploadCover: 'Загрузить обложку',
  galleryTitle: 'Галерея',
  galleryDescription:
    'Картинки в карточке записи. Первая — главная, порядок меняется стрелками.',
  galleryEmpty: 'В галерее пока нет картинок',
  upload: 'Загрузить',
  uploaded: 'Картинка загружена',
  coverUploaded: 'Обложка обновлена',
  saved: 'Галерея сохранена',
  removed: 'Картинка убрана из галереи',
  loadError: 'Не удалось загрузить картинки',
  uploadError: 'Не удалось загрузить картинку',
  saveError: 'Не удалось сохранить галерею',
  retry: 'Попробовать снова',
  tooLarge: 'Файл больше 10 МБ',
  galleryFull: 'В галерее уже 50 картинок',
  moveUp: 'Раньше',
  moveDown: 'Позже',
  remove: 'Убрать из галереи',
  open: 'Открыть в новой вкладке',
  removeTitle: 'Убрать картинку?',
  removeDescription:
    'Картинка пропадёт из галереи записи. Файл останется в хранилище: им могут пользоваться другие записи.',
  removeConfirm: 'Убрать',
  cancel: 'Отмена',
  imageAlt: 'Картинка записи',
  coverAlt: 'Обложка записи',
} as const;

/** Иконки блока картинок. */
export const WORKSHOP_IMAGE_ICON = {
  title: 'tabler:photo',
  upload: 'tabler:upload',
  moveUp: 'tabler:arrow-left',
  moveDown: 'tabler:arrow-right',
  remove: 'tabler:trash',
  open: 'tabler:external-link',
  empty: 'tabler:photo-off',
} as const;
