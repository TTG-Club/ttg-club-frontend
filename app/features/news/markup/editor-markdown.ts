/**
 * Снимает служебное экранирование, которое @tiptap/markdown навешивает на текст
 * при сериализации редактора: обратный слеш перед парными символами Markdown
 * (`escapeMarkdownSyntax`) и HTML-сущности `&`/`<`/`>` (`encodeHtmlEntities`).
 *
 * Одним проходом, чтобы `\\~` (автор написал слеш и тильду) не развалился на
 * второй итерации, а `&amp;amp;` дал ровно `&amp;`.
 */
const EDITOR_ESCAPE_REGEXP = /\\([\\`*_[\]~])|&(amp|lt|gt);/g;

/** Сущности, которыми @tiptap/markdown кодирует текст (`encodeHtmlEntities`). */
const HTML_ENTITY_CHARACTERS: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
};

/**
 * Разворачивает одно совпадение `EDITOR_ESCAPE_REGEXP` в литеральный символ.
 *
 * @param match - Совпадение целиком (фолбэк для незнакомой сущности)
 * @param character - Символ из-под обратного слеша
 * @param entity - Имя HTML-сущности без `&` и `;`
 * @returns Литеральный символ либо исходное совпадение
 */
function toLiteralCharacter(
  match: string,
  character: string | undefined,
  entity: string | undefined,
): string {
  if (character !== undefined) {
    return character;
  }

  return entity === undefined
    ? match
    : (HTML_ENTITY_CHARACTERS[entity] ?? match);
}

/**
 * Возвращает тексту из редактора литеральные символы.
 *
 * Markdown для нас — лишь транспорт round-trip'а `{@...}` (см. MarkupEditor):
 * рендер страницы разбирает только маркеры, а Markdown-синтаксис печатает как
 * есть. Поэтому служебное экранирование @tiptap/markdown обязано сниматься на
 * границе хранения — иначе набранные автором `~` и `&` уходят на страницу как
 * `\~` и `&amp;`.
 *
 * @param value - Сегмент исходника из визуального редактора
 * @returns Текст без служебного экранирования
 */
export function unescapeEditorMarkdown(value: string): string {
  return value.replace(EDITOR_ESCAPE_REGEXP, toLiteralCharacter);
}
