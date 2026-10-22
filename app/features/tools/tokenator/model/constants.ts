/** Сторона токена в единицах SVG и пикселях готовой картинки. */
export const TOKEN_SIZE = 512;

/** Радиус круга, в который вписывается картинка под рамкой. */
export const TOKEN_CLIP_RADIUS = 210;

/** Масштаб картинки внутри токена. */
export const TOKEN_SCALE = {
  min: 0.1,
  max: 2,
  /** Шаг ползунка. */
  step: 0.01,
  /** Начальный масштаб: картинка чуть больше круга. */
  initial: 1.1,
  /** Сколько масштаба даёт один пиксель прокрутки колесом. */
  wheel: 0.002,
} as const;

/** Ограничения на загружаемую картинку, как в старом SPA. */
export const TOKEN_LIMIT = {
  /** Вес файла, МБ. */
  sizeMb: 50,
  /** Ширина и высота, px. */
  dimension: 8064,
} as const;

/** Байтов в мегабайте. */
export const BYTES_IN_MB = 1024 ** 2;

/** Фон и рамка токена. */
export const TOKEN_IMAGE = {
  background: '/img/token/token-bg.webp',
  border: '/img/token/token-border.webp',
} as const;

/** Форматы скачивания; первый — по умолчанию. */
export const TOKEN_FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WEBP' },
] as const;

/** Имя скачиваемого файла без расширения. */
export const TOKEN_FILE_NAME = 'token';

export const TOKENATOR_TEXT = {
  title: 'Токенатор',
  limits: 'Ограничения',
  sizeLimit: `Вес картинки — не больше ${TOKEN_LIMIT.sizeMb} МБ`,
  dimensionLimit: `Размер — не больше ${TOKEN_LIMIT.dimension} × ${TOKEN_LIMIT.dimension} px`,
  hint: 'Двигайте картинку мышью или пальцем, масштаб меняйте ползунком, колесом с Ctrl (⌘ на Mac) или щипком.',
  scale: 'Масштаб',
  mirror: 'Отразить',
  center: 'Центрировать',
  upload: 'Загрузить картинку',
  download: 'Скачать',
  downloadFormat: 'Формат',
  drop: 'Перетащите картинку сюда или нажмите, чтобы выбрать',
  notImage: 'Токенатор поддерживает только изображения.',
  tooLarge: 'Файл весит больше допустимого.',
  tooBig: 'Ширина или высота картинки больше допустимой.',
  broken: 'Не удалось прочитать картинку.',
} as const;

export const TOKENATOR_ICON = {
  upload: 'tabler:upload',
  download: 'tabler:download',
  mirror: 'tabler:flip-vertical',
  center: 'tabler:focus-centered',
  format: 'tabler:chevron-down',
} as const;

/** Зеркальное отражение картинки внутри её рамки. */
export const TOKEN_MIRROR = {
  x: '-100%',
  transform: 'scale(-1, 1)',
} as const;
