import type { MarkdownParseHelpers } from '@tiptap/core';

import { Extension } from '@tiptap/core';

import { BLOCK_MARKER_NODE, SEPARATOR_MARKER } from './constants';

/**
 * Имя markdown-токена тематического разрыва у marked (`---`, `***`, `___`).
 * Его же слушает штатный `HorizontalRule` TipTap.
 */
const THEMATIC_BREAK_TOKEN = 'hr';

/**
 * Приоритет выше дефолтного (100): `@tiptap/markdown` перебирает обработчики
 * одного токена в порядке расширений, а те отсортированы по убыванию приоритета.
 * Так наш разбор встаёт ПЕРЕД штатным `HorizontalRule`, который иначе создал бы
 * узел `horizontalRule` — он сериализуется обратно в «---», а такого маркера в
 * разметке нет, и линия выходила бы на страницу текстом.
 */
const SEPARATOR_PRIORITY = 200;

/**
 * Тематический разрыв Markdown → наш блочный маркер `{@separator}`.
 *
 * Отдельным расширением (а не на узле), как `TtgHeadingMarkdown`/
 * `TtgParagraphMarkdown`: штатный `HorizontalRule` убрать нельзя — `@nuxt/ui`
 * добавляет его к `UEditor` всегда, кроме режима `starter-kit={false}`, который
 * нам не подходит (он же отключает настройки StarterKit, которыми мы заменяем
 * заголовок, абзац и списки на свои узлы). Поэтому перехватываем токен по
 * приоритету.
 */
export const TtgSeparatorMarkdown = Extension.create({
  name: 'ttgSeparatorMarkdown',
  priority: SEPARATOR_PRIORITY,

  markdownTokenName: THEMATIC_BREAK_TOKEN,
  parseMarkdown: (_token, helpers: MarkdownParseHelpers) =>
    helpers.createNode(BLOCK_MARKER_NODE, { raw: SEPARATOR_MARKER }),
});
