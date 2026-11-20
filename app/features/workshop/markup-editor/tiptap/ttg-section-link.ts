import type {
  JSONContent,
  MarkdownRendererHelpers,
  MarkdownToken,
} from '@tiptap/core';

import { mergeAttributes, Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import {
  SECTION_LINK_ATTR,
  SECTION_LINK_KIND_ATTR,
  SECTION_LINK_URL_ATTR,
} from './constants';
import { classifyLinkMarker, sanitizeLabel } from './link-markers';
import SectionLinkChip from './SectionLinkChip.vue';

/** Плоский текст подписи из содержимого узла (content — `text*`), либо '' если контент не в JSON-форме. */
function readLabel(node: JSONContent): string {
  const content = node.content;

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((child) => (typeof child.text === 'string' ? child.text : ''))
    .join('');
}

/**
 * ИНЛАЙНОВЫЙ узел с РЕДАКТИРУЕМОЙ подписью для ссылок `{@... | url:...}`: ссылок на
 * разделы сайта ({@spell}/{@species}/…) и обычной внешней ссылки ({@link}). В
 * отличие от атомарного `ttgMarker`, подпись — обычный текст (курсор внутрь,
 * правка по буквам), а `kind`/`url` хранятся атрибутами. Обратно сериализуется в
 * `{@<kind> подпись | url:<url>}` — форма хранения и рендер страницы не меняются.
 *
 * Марки в подписи запрещены (`marks: ''`): подпись всегда простой текст, чтобы
 * round-trip оставался предсказуемым.
 */
export const TtgSectionLink = Node.create({
  name: 'ttgSectionLink',
  group: 'inline',
  inline: true,
  content: 'text*',
  marks: '',
  selectable: true,

  markdownTokenName: 'ttgSectionLink',
  parseMarkdown: (token: MarkdownToken) => {
    const parsed = classifyLinkMarker(String(token.raw ?? ''));

    if (!parsed) {
      // До сюда доходят только классифицированные токены; ветка — страховка.
      return { type: 'ttgSectionLink', attrs: { kind: 'link', url: '' } };
    }

    return {
      type: 'ttgSectionLink',
      attrs: { kind: parsed.kind, url: parsed.url },
      content: parsed.label ? [{ type: 'text', text: parsed.label }] : [],
    };
  },
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const kind = String(node.attrs?.kind ?? 'link');
    const url = String(node.attrs?.url ?? '');

    // Подпись — простой текст: читаем его напрямую (без markdown-экранирования,
    // которое мог бы добавить renderChildren на `*`/`_`). renderChildren —
    // фолбэк, если контент пришёл не JSON-массивом.
    const inner =
      readLabel(node)
      || (typeof helpers?.renderChildren === 'function'
        ? helpers.renderChildren(node)
        : '');

    // Пустую подпись подменяем url, чтобы собранный `{@...}` не упал на парсере
    // (маркер обязан иметь текст) и ссылка не потерялась при полном стирании.
    const label = sanitizeLabel(inner.trim()) || url;

    return `{@${kind} ${label} | url:${url}}`;
  },

  addAttributes() {
    return {
      kind: {
        default: 'link',
        parseHTML: (element) =>
          element.getAttribute(SECTION_LINK_KIND_ATTR) ?? 'link',
        renderHTML: (attributes) => ({
          [SECTION_LINK_KIND_ATTR]: attributes.kind,
        }),
      },
      url: {
        default: '',
        parseHTML: (element) =>
          element.getAttribute(SECTION_LINK_URL_ATTR) ?? '',
        renderHTML: (attributes) => ({
          [SECTION_LINK_URL_ATTR]: attributes.url,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[${SECTION_LINK_ATTR}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ [SECTION_LINK_ATTR]: '' }, HTMLAttributes),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(SectionLinkChip);
  },
});
