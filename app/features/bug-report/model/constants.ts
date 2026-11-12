import type { BrushColor, BugReportType, BugReportTypeText } from './types';

/**
 * Сервис баг-репортов. Запрос идёт в него напрямую, как из старого SPA:
 * сервис принимает запросы с любого сайта TTG.
 */
export const BUG_REPORT_API_URL = 'https://bug-report.api.ttg.club/api/v1/bugs';

/** Платформа этого сайта в сервисе баг-репортов. */
export const BUG_REPORT_SOURCE_PLATFORM = 'SITE_5E14';

/** Ключ гостя для ограничения частоты репортов. */
export const BUG_REPORT_GUEST_ID_STORAGE_KEY = 'bug-report:guest-id';

/** Ответ сервиса на слишком частые репорты. */
export const BUG_REPORT_TOO_MANY_REQUESTS_STATUS = 429;

/** Длина описания, которую принимает сервис. */
export const BUG_REPORT_DESCRIPTION_MAX_LENGTH = 2000;

/** Цвета кисти для пометок на скриншоте. */
export const BRUSH_COLORS: ReadonlyArray<BrushColor> = [
  { name: 'Жёлтый', value: '#FACC15' },
  { name: 'Красный', value: '#EF4444' },
  { name: 'Зелёный', value: '#22C55E' },
  { name: 'Синий', value: '#3B82F6' },
  { name: 'Оранжевый', value: '#F97316' },
  { name: 'Белый', value: '#FFFFFF' },
];

/** Цвет кисти по умолчанию. */
export const DEFAULT_BRUSH_COLOR = '#FACC15';

/** Толщина кисти в CSS-пикселях. */
export const BRUSH_SIZE = 4;

/** Сколько пометок можно отменить. */
export const MAX_UNDO_STEPS = 50;

/** Сколько символов вокруг выделенного текста уходит в репорт. */
export const SELECTION_CONTEXT_LENGTH = 50;

/** Ширина формы и панели инструментов: столько места скриншоту не достаётся. */
export const MODAL_CHROME_WIDTH = 560;

/** Доля высоты окна под скриншот. */
export const SCREENSHOT_MAX_HEIGHT_RATIO = 0.7;

/** Доля ширины окна под модалку. */
export const MODAL_MAX_WIDTH_RATIO = 0.9;

/** Наименьший размер холста скриншота. */
export const CANVAS_MIN_SIZE = { width: 300, height: 200 } as const;

/**
 * Предел длинной стороны отправляемого скриншота: холст хранит оригинал, а
 * 4K-снимок без предела разрастается в размере.
 */
export const MAX_SCREENSHOT_EXPORT_SIZE = 3840;

/** Формат отправляемого скриншота; без кодировщика webp браузер отдаёт png. */
export const SCREENSHOT_EXPORT_MIME = 'image/webp';

/** Качество webp. */
export const SCREENSHOT_EXPORT_QUALITY = 0.92;

/** Имена файла скриншота по формату. */
export const SCREENSHOT_FILE_NAME = {
  webp: 'screenshot.webp',
  png: 'screenshot.png',
} as const;

/** Инструменты рисования. */
export const DRAWING_TOOLS = ['brush', 'circle', 'rectangle'] as const;

/** Подписи и иконки инструментов рисования. */
export const DRAWING_TOOL_BUTTONS = [
  { tool: 'brush', label: 'Кисть', icon: 'tabler:pencil' },
  { tool: 'circle', label: 'Круг', icon: 'tabler:circle' },
  { tool: 'rectangle', label: 'Прямоугольник', icon: 'tabler:square' },
] as const;

/** Тексты баг-репорта. */
export const BUG_REPORT_TEXT = {
  open: 'Сообщить о баге',
  author: 'Автор',
  anonymous: 'Аноним',
  signInHint: 'Войдите, чтобы ваше имя было видно в репорте',
  page: 'Страница',
  selection: 'Выделенный текст',
  removeSelection: 'Убрать выделенный текст',
  selectionHint: 'Выделите текст на странице и нажмите «Ошибка в тексте»',
  selectionButton: 'Ошибка в тексте',
  submitHint: 'Ctrl + Enter — отправить',
  screenshot: 'Вставьте скриншот',
  screenshotHint: 'Сделайте снимок экрана и вставьте его сочетанием Ctrl + V',
  screenshotFile: 'или нажмите, чтобы выбрать файл',
  undo: 'Отменить пометку',
  removeScreenshot: 'Убрать скриншот',
  cancel: 'Отменить',
  submit: 'Отправить',
  failed: 'Ошибка отправки',
  failedDescription:
    'Не удалось отправить баг-репорт. Пожалуйста, попробуйте позже.',
  tooMany:
    'Слишком много запросов. Пожалуйста, подождите немного перед следующей отправкой.',
} as const;

/** Иконки баг-репорта. */
export const BUG_REPORT_ICON = {
  bug: 'tabler:bug',
  failed: 'tabler:alert-triangle',
  author: 'tabler:user-check',
  anonymous: 'tabler:user-question',
  page: 'tabler:link',
  selection: 'tabler:text-scan-2',
  close: 'tabler:x',
  screenshot: 'tabler:photo-plus',
  undo: 'tabler:arrow-back-up',
  remove: 'tabler:trash',
} as const;

/** Типы записи в сервисе баг-репортов: ошибка или пожелание. */
export const BUG_REPORT_TYPES = ['BUG', 'WISH'] as const;

/** Окно каждый раз открывается на баге. */
export const DEFAULT_BUG_REPORT_TYPE: BugReportType = 'BUG';

/** Иконки типов записи. */
export const BUG_REPORT_TYPE_ICON: Record<BugReportType, string> = {
  BUG: 'tabler:bug',
  WISH: 'tabler:bulb',
};

/** Вкладки типа в окне отправки, как на new.ttg.club. */
export const BUG_REPORT_TYPE_TABS: Array<{
  label: string;
  value: BugReportType;
  icon: string;
}> = [
  { label: 'Баг-репорт', value: 'BUG', icon: BUG_REPORT_TYPE_ICON.BUG },
  { label: 'Пожелание', value: 'WISH', icon: BUG_REPORT_TYPE_ICON.WISH },
];

/** Заголовок, описание и тост окна под тип записи. */
export const BUG_REPORT_TYPE_TEXT: Record<BugReportType, BugReportTypeText> = {
  BUG: {
    title: 'Сообщить о баге',
    description: 'Описание проблемы',
    descriptionPlaceholder: 'Опишите, что произошло...',
    sent: 'Репорт отправлен',
    sentDescription: 'Спасибо за обратную связь! Мы рассмотрим ваш репорт.',
  },
  WISH: {
    title: 'Предложить идею',
    description: 'Описание пожелания',
    descriptionPlaceholder: 'Опишите, что хотелось бы добавить или улучшить...',
    sent: 'Пожелание отправлено',
    sentDescription: 'Спасибо за идею! Мы рассмотрим ваше пожелание.',
  },
};
