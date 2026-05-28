import type { BrushColor, SourcePlatform } from './types';

/** Предустановленные цвета кисти для рисования на скриншоте */
export const BRUSH_COLORS: ReadonlyArray<BrushColor> = [
  { name: 'yellow', value: '#FACC15' },
  { name: 'red', value: '#EF4444' },
  { name: 'green', value: '#22C55E' },
  { name: 'blue', value: '#3B82F6' },
  { name: 'orange', value: '#F97316' },
  { name: 'white', value: '#FFFFFF' },
];

/** Цвет кисти по умолчанию (жёлтый) */
export const DEFAULT_BRUSH_COLOR: BrushColor = BRUSH_COLORS[0] || {
  name: 'yellow',
  value: '#FACC15',
};

/** Размер кисти по умолчанию (в пикселях) */
export const DEFAULT_BRUSH_SIZE = 4;

/** Максимальное количество шагов отмены (undo) */
export const MAX_UNDO_STEPS = 50;

/** Количество символов контекста до/после выделенного текста */
export const SELECTION_CONTEXT_LENGTH = 50;

/** Ширина «хрома» модалки (форма + toolbar + отступы), вычитается из viewport для canvas */
export const MODAL_CHROME_WIDTH = 560;

/** URL API микросервиса баг-репортов напрямую */
export const BUG_REPORT_API_URL = 'https://bug-report.api.ttg.club/api/v1/bugs';

/** Платформа-источник бага для сайта TTG (Сайт 2014) */
export const SOURCE_PLATFORM: SourcePlatform = 'SITE_5E14';

/** Имя анонимного пользователя по умолчанию */
export const BUG_REPORT_ANONYMOUS_USER = 'Аноним';

/** Заголовок и описание успешной отправки репорта */
export const BUG_REPORT_SUBMIT_SUCCESS_TITLE = 'Репорт отправлен';

export const BUG_REPORT_SUBMIT_SUCCESS_DESC =
  'Спасибо за обратную связь! Мы рассмотрим ваш репорт.';

/** Заголовок и описание ошибки при отправке репорта */
export const BUG_REPORT_SUBMIT_ERROR_TITLE = 'Ошибка отправки';

export const BUG_REPORT_SUBMIT_ERROR_DESC =
  'Не удалось отправить баг-репорт. Пожалуйста, попробуйте позже.';

/** Описание ошибки превышения лимита запросов (429) */
export const BUG_REPORT_SUBMIT_LIMIT_DESC =
  'Слишком много запросов. Пожалуйста, подождите немного перед следующей отправкой.';
