import type {
  MarkdownLexerConfiguration,
  MarkdownToken,
  MarkdownTokenizer,
} from '@tiptap/core';

import { findMarkerEnd } from '~news/markup';

/** Пустая полезная нагрузка токена (блок-чипу нужны только type+raw). */
const EMPTY_DATA: Record<string, never> = {};

/** Инлайн-токены содержимого блока, вычисляемые ЛЕНИВО (на фазе parseMarkdown). */
export type DeferredInlineTokens = () => MarkdownToken[];

/** Блочные токены вложенного содержимого, вычисляемые ЛЕНИВО (на фазе parseMarkdown). */
export type DeferredBlockTokens = () => MarkdownToken[];

/**
 * Откладывает инлайн-токенизацию содержимого блочного маркера (ячейки таблицы,
 * пункта списка, абзаца цитаты) до фазы `parseMarkdown` вместо немедленного
 * вызова `lexer.inlineTokens(...)` внутри токенайзера.
 *
 * ПОЧЕМУ это обязательно (иначе теряется текст ПОСЛЕ таблицы/списка/цитаты):
 * `@tiptap/markdown` передаёт блочному токенайзеру `lexer`, чей `inlineTokens`
 * ходит в ОТДЕЛЬНЫЙ постоянный marked-Lexer менеджера, а НЕ в транзитный лексер,
 * который прямо сейчас лексит документ. Оба Lexer'а делят ОДИН объект Tokenizer,
 * а `inlineTokens`/`blockTokens` внутри делают `tokenizer.lexer = this`. Значит
 * вызов `lexer.inlineTokens` во время блочной токенизации перенаводит общий
 * токенайзер на лексер менеджера. После этого КАЖДЫЙ следующий абзац документа
 * встаёт в `inlineQueue` лексера менеджера, который в этом проходе никогда не
 * сливается (`lex()` сливает очередь ТРАНЗИТНОГО лексера) → инлайн-содержимое
 * таких абзацев молча теряется (абзац приходит пустым).
 *
 * `parseMarkdown` вызывается уже из `parseTokens`, когда весь документ разобран
 * на блоки: лексинг завершён, перенаводить общий токенайзер не на что, поэтому
 * ленивый `lexer.inlineTokens(source)` безопасен. НЕ вызывать `lexer.inlineTokens`
 * из `buildData`.
 */
export function deferInline(
  lexer: MarkdownLexerConfiguration,
  source: string,
): DeferredInlineTokens {
  return () => lexer.inlineTokens(source);
}

/**
 * Откладывает БЛОЧНУЮ токенизацию вложенного блока (например `{@table}`/`{@list}`
 * внутри ячейки таблицы) до фазы `parseMarkdown` — по той же причине, что и
 * `deferInline` (см. выше): вызов `lexer.blockTokens(...)` во время токенизации
 * документа перенаводит общий marked-Tokenizer на постоянный лексер менеджера и
 * рушит инлайн-содержимое следующих абзацев документа. В `parseMarkdown` лексинг
 * документа уже завершён, поэтому вложенная блочная токенизация безопасна.
 *
 * `source` должен быть ОДНИМ блочным маркером `{@…}` (без окружающего текста):
 * так `blockTokens` возвращает ровно один кастомный токен без «голого» абзаца,
 * которому пришлось бы отдельно достраивать инлайн. Полученные токены отдаются в
 * `helpers.parseChildren`, который соберёт из них нативные редактируемые узлы.
 */
export function deferBlock(
  lexer: MarkdownLexerConfiguration,
  source: string,
): DeferredBlockTokens {
  return () => lexer.blockTokens(source);
}

/**
 * Читает имя маркера `{@name …}` (до пробела/`}`) и сверяет со списком имён.
 * Так `{@listfoo}` не пройдёт за `{@list`. Единый предикат для isList/isTable/
 * isQuoteMarkerStart — они отличаются только набором имён.
 *
 * @param source - Строка, потенциально начинающаяся с маркера
 * @param names - Допустимые имена маркера (тип + алиасы)
 */
export function markerNameMatches(
  source: string,
  names: ReadonlySet<string>,
): boolean {
  if (!source.startsWith('{@')) {
    return false;
  }

  let cursor = 2;

  while (
    cursor < source.length
    && source[cursor] !== ' '
    && source[cursor] !== '}'
  ) {
    cursor++;
  }

  // Имя должно завершаться реальным терминатором (пробел/`}`), а не концом
  // строки: `{@list` без закрытия — незавершённый маркер, не начало списка.
  return cursor < source.length && names.has(source.slice(2, cursor));
}

/**
 * Фабрика БЛОЧНОГО markdown-токенайзера для маркера `{@…}`, занимающего строку
 * целиком (список/таблица/цитата/блок-чип). Скелет у всех одинаков: маркер идёт
 * с начала строки, `findMarkerEnd` даёт границу, после `}` допустимы лишь пробелы
 * и перевод строки, затем `buildData` строит полезную нагрузку токена (undefined
 * — маркер невалиден). Вынесено, чтобы 4 блочных токенайзера не дублировали код.
 *
 * @param token - Имя markdown-токена (совпадает с markdownTokenName расширения)
 * @param isStart - Начинается ли строка ИМЕННО с нужного маркера
 * @param buildData - Строит поля токена из сырого маркера (или undefined, если
 *   маркер невалиден — тогда токен не создаётся). По умолчанию — пустой объект
 *   (когда валидность полностью определяется `isStart`, как у блок-чипа).
 */
export function createBlockMarkerTokenizer(
  token: string,
  isStart: (source: string) => boolean,
  buildData: (
    raw: string,
    lexer: MarkdownLexerConfiguration,
  ) => object | undefined = () => EMPTY_DATA,
): MarkdownTokenizer {
  return {
    name: token,
    level: 'block',
    start: (source: string) => {
      if (isStart(source)) {
        return 0;
      }

      const index = source.indexOf('\n{@');

      return index >= 0 && isStart(source.slice(index + 1)) ? index + 1 : -1;
    },
    tokenize: (
      source: string,
      _tokens: MarkdownToken[],
      lexer: MarkdownLexerConfiguration,
    ): MarkdownToken | undefined => {
      if (!isStart(source)) {
        return undefined;
      }

      const end = findMarkerEnd(source);

      if (end < 0) {
        return undefined;
      }

      const trailing = source.slice(end).match(/^[ \t]*(\n+|$)/);

      if (!trailing) {
        return undefined;
      }

      const data = buildData(source.slice(0, end), lexer);

      if (!data) {
        return undefined;
      }

      return {
        type: token,
        raw: source.slice(0, end + trailing[0].length),
        ...data,
      };
    },
  };
}
