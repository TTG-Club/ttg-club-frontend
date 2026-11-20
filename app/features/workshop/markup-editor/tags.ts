/** Пункт «Запись сайта»: поиск по всем разделам, ссылка по адресу записи. */
export const SITE_SECTION_TAG_KEY = 'site';

/** Поиск записи для ссылки: столько результатов, задержка ввода, минимум символов. */
export const SECTION_SEARCH_SIZE = 20;
export const SECTION_SEARCH_DEBOUNCE_MS = 300;
export const SECTION_SEARCH_MIN_LENGTH = 2;
export const SECTION_SEARCH_HINT = 'Введите минимум 2 символа';

/**
 * Описание вставляемого через тулбар кастомного тега разметки {@...}.
 *
 * Итоговая строка вставки формируется как `${before}${выделение|placeholder}${after}`.
 * Используется РЕЖИМОМ КОДА (сырой текст в textarea). Весь вывод — только {@...}
 * (Markdown не используется). В визуальном режиме форматирование идёт марками, а
 * блочные элементы вставляются как {@...}-чипы (см. toolbar-items.ts), набор и
 * порядок кнопок совпадает, чтобы оба режима выглядели одинаково.
 */
export interface MarkupTag {
  /** Уникальный ключ тега. */
  key: string;
  /** Подпись кнопки/пункта меню. */
  label: string;
  /** Иконка из коллекции tabler. */
  icon: string;
  /** Текст, вставляемый перед выделением. */
  before: string;
  /** Текст, вставляемый после выделения. */
  after: string;
  /** Значение-заглушка, если выделение пустое. */
  placeholder: string;
}

/**
 * Инлайновое форматирование (жирный/курсив/подчёркнутый/зачёркнутый/индексы/
 * выделение). Только {@...}, в визуале — марки того же порядка.
 */
export const FORMAT_TAGS: MarkupTag[] = [
  {
    key: 'bold',
    label: 'Жирный',
    icon: 'tabler:bold',
    before: '{@b ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'italic',
    label: 'Курсив',
    icon: 'tabler:italic',
    before: '{@i ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'underline',
    label: 'Подчёркнутый',
    icon: 'tabler:underline',
    before: '{@u ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'strike',
    label: 'Зачёркнутый',
    icon: 'tabler:strikethrough',
    before: '{@s ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'superscript',
    label: 'Верхний индекс',
    icon: 'tabler:superscript',
    before: '{@sup ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'subscript',
    label: 'Нижний индекс',
    icon: 'tabler:subscript',
    before: '{@sub ',
    after: '}',
    placeholder: 'текст',
  },
  {
    key: 'highlight',
    label: 'Выделение',
    icon: 'tabler:highlight',
    before: '{@mark ',
    after: '}',
    placeholder: 'текст',
  },
];

/**
 * Блочные/структурные теги {@...} (заголовки H1–H3, списки, цитата, ссылка).
 * Порядок и набор совпадают с блочными кнопками визуального тулбара.
 */
export const BLOCK_TAGS: MarkupTag[] = [
  {
    key: 'heading-1',
    label: 'Заголовок 1',
    icon: 'tabler:h-1',
    before: '{@h ',
    after: ' | level:1}',
    placeholder: 'Заголовок',
  },
  {
    key: 'heading-2',
    label: 'Заголовок 2',
    icon: 'tabler:h-2',
    before: '{@h ',
    after: ' | level:2}',
    placeholder: 'Заголовок',
  },
  {
    key: 'heading-3',
    label: 'Заголовок 3',
    icon: 'tabler:h-3',
    before: '{@h ',
    after: ' | level:3}',
    placeholder: 'Заголовок',
  },
  {
    key: 'bullet-list',
    label: 'Маркированный список',
    icon: 'tabler:list',
    before: '{@list {@li ',
    after: '}}',
    placeholder: 'пункт',
  },
  {
    key: 'ordered-list',
    label: 'Нумерованный список',
    icon: 'tabler:list-numbers',
    before: '{@list {@li ',
    after: '} | type:ordered}',
    placeholder: 'пункт',
  },
  {
    key: 'quote',
    label: 'Цитата',
    icon: 'tabler:quote',
    before: '{@quote ',
    after: '}',
    placeholder: 'цитата',
  },
  {
    key: 'separator',
    label: 'Разделитель',
    icon: 'tabler:separator-horizontal',
    before: '{@separator ',
    after: '}',
    placeholder: '',
  },
  {
    key: 'table',
    label: 'Таблица',
    icon: 'tabler:table',
    before: '{@table {@tr {@th ',
    after: '}{@th }}{@tr {@td }{@td }}}',
    placeholder: '',
  },
];

/**
 * Листовые инлайновые теги-чипы (не форматирование). Ссылка — ИНЛАЙНОВАЯ (её
 * вставка не должна рвать абзац на части, поэтому она здесь, а не в BLOCK_TAGS).
 */
export const INLINE_TAGS: MarkupTag[] = [
  {
    key: 'kbd',
    label: 'Клавиша',
    icon: 'tabler:keyboard',
    before: '{@kbd ',
    after: '}',
    placeholder: 'Ctrl',
  },
  {
    key: 'link',
    label: 'Ссылка',
    icon: 'tabler:link',
    before: '{@link ',
    after: ' | url:}',
    placeholder: 'текст',
  },
];

/**
 * Интерактивные теги (бросок кубика, бейдж) — доменная логика TTG, аналога в
 * Markdown нет.
 */
export const INTERACTIVE_TAGS: MarkupTag[] = [
  {
    key: 'dice',
    label: 'Бросок кубика',
    icon: 'tabler:dice',
    before: '{@dice ',
    after: '}',
    placeholder: '2d6',
  },
  {
    key: 'badge',
    label: 'Бейдж',
    icon: 'tabler:badge',
    before: '{@badge ',
    after: ' | color:primary}',
    placeholder: 'текст',
  },
];

/**
 * Ссылки на разделы сайта (открывают дровер сущности). Требуют атрибут `url`
 * (slug сущности), который автор заполняет вручную после вставки.
 */
export const SECTION_TAGS: MarkupTag[] = [
  {
    key: 'spell',
    label: 'Заклинание',
    icon: 'tabler:sparkles',
    before: '{@spell ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'creature',
    label: 'Существо',
    icon: 'tabler:paw',
    before: '{@creature ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'class',
    label: 'Класс',
    icon: 'tabler:sword',
    before: '{@class ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'species',
    label: 'Раса',
    icon: 'tabler:friends',
    before: '{@species ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'feat',
    label: 'Черта',
    icon: 'tabler:award',
    before: '{@feat ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'background',
    label: 'Предыстория',
    icon: 'tabler:book',
    before: '{@background ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'magicItem',
    label: 'Магический предмет',
    icon: 'tabler:wand',
    before: '{@magicItem ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'item',
    label: 'Предмет',
    icon: 'tabler:briefcase',
    before: '{@item ',
    after: ' | url:}',
    placeholder: 'название',
  },
  {
    key: 'glossary',
    label: 'Ширма',
    icon: 'tabler:layout-dashboard',
    before: '{@glossary ',
    after: ' | url:}',
    placeholder: 'термин',
  },
  {
    key: SITE_SECTION_TAG_KEY,
    label: 'Запись сайта',
    icon: 'tabler:world-search',
    before: '{@link ',
    after: ' | url:/}',
    placeholder: 'название',
  },
];

/** Набор кнопок редактора: полный (мастерская) или базовый (пользовательские формы). */
export type MarkupEditorPreset = 'full' | 'basic';

/**
 * Ключи тегов базового набора — только оформление обычного текста: жирный/курсив/
 * подчёркнутый/зачёркнутый, заголовки, списки, цитата и ссылка. Доменные вставки
 * (кубик, бейдж, клавиша, таблица, разделитель, ссылки на разделы) сюда не входят —
 * в пользовательских формах (баг-репорт) они только путают.
 */
export const BASIC_TAG_KEYS: ReadonlySet<string> = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'heading-1',
  'heading-2',
  'heading-3',
  'bullet-list',
  'ordered-list',
  'quote',
  'link',
]);
