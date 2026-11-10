// Предупреждение MarkupSectionLink: ссылка без адреса раздела или с незнакомым
// типом рисуется обычным текстом.
export const SECTION_LINK_PLAIN_TEXT_WARNING =
  '[Markup] Section link is rendered as plain text:';

// Наивысшая допустимая глубина вложенности.
export const MAX_DEPTH = 7;

// Максимальный размер строки.
export const MAX_STRING_LENGTH = 65536;

// Первый символ маркера
export const LEADING_CHARACTER = '@';

// Заглушка ПУСТОЙ ячейки таблицы: zero-width space (U+200B). НЕ вырезается
// String.trim() (категория Cf, не WhiteSpace), поэтому `{@td …}` с пустой
// ячейкой не падает в convertMarker («must have text») и остаётся невидимой.
// Общая для сериализатора разметки и редактора (ttg-table.ts).
export const CELL_PLACEHOLDER = '\u200B';

// Тематический разрыв Markdown (`---`, `***`, `___`) отдельной строкой. Нашей
// разметке он неизвестен, поэтому на границе хранения приводится к
// `{@separator}` — иначе линия из редактора выходит на страницу текстом «---».
export const THEMATIC_BREAK_REGEXP = /^(?:-{3,}|\*{3,}|_{3,})$/;

// Пустой абзац: этим маркером @tiptap/markdown сохраняет пустую строку между
// абзацами при round-trip. Своего содержимого такой абзац не несёт, и на странице
// маркер печатался бы буквально — на границе хранения сегмент отбрасывается.
// Общий для редактора (ttg-paragraph.ts) и сериализатора.
export const EMPTY_PARAGRAPH_MARKDOWN = '&nbsp;';

// Тип блочного маркера-разделителя. Вертикальную отбивку вокруг него задаёт сам
// MarkupSeparator (паддингом), поэтому MarkupRender гасит margin'ы и у него, и у
// соседних блоков — см. GROUP_SPACING_*.
export const SEPARATOR_BLOCK_TYPE = 'separator';

// Обычная отбивка блока описания от следующего.
export const GROUP_SPACING = 'mb-2';

// Отбивка вокруг разделителя: свои margin'ы группа не добавляет.
export const GROUP_SPACING_SEPARATOR = 'mb-0';

// Блок ПЕРЕД разделителем: нижний margin не нужен, зазор даёт сам разделитель.
export const GROUP_SPACING_BEFORE_SEPARATOR = 'mb-0';

// Блок ПОСЛЕ разделителя: верхний margin гасим принудительно — заголовок задаёт
// свой `mt-*` изнутри (MarkupHeading), и без этого зазор снизу линии оказывался
// шире, чем сверху.
export const GROUP_SPACING_AFTER_SEPARATOR = 'mt-0! mb-2';

// Атрибут с id якоря заголовка. Живёт только в дереве для рендера — в
// хранимую разметку не попадает.
export const HEADING_ANCHOR_ATTRIBUTE = 'anchor';

/**
 * Разделы нового сайта, на записи которых ссылаются маркеры `{@spell ...}`,
 * `{@class ...}` и т. п.: тип маркера → первый сегмент пути.
 */
export const SECTION_LINK_PATHS: ReadonlyMap<string, string> = new Map([
  ['class', 'classes'],
  ['species', 'species'],
  ['spell', 'spells'],
  ['feat', 'feats'],
  ['background', 'backgrounds'],
  ['magicItem', 'magic-items'],
  ['item', 'items'],
  ['creature', 'bestiary'],
  ['glossary', 'glossary'],
]);
