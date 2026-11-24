import { Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import {
  BLOCK_MARKER_ATTR,
  BLOCK_MARKER_NODE,
  HORIZONTAL_RULE_TAG,
  SEPARATOR_MARKER,
} from './constants';
import MarkerChip from './MarkerChip.vue';
import { blockMarkerMarkdownTokenizer } from './marks';

/**
 * Приоритет правила разбора `<hr>`: больше дефолтных 50 ProseMirror, поэтому
 * тег достаётся нам, а не штатному `HorizontalRule`, узел которого разметка
 * выразить не может.
 */
const HORIZONTAL_RULE_PARSE_PRIORITY = 100;

/**
 * Атомарный БЛОЧНЫЙ узел для блочных маркеров {@...} (заголовок, список, цитата,
 * разделитель, таблица). В отличие от инлайнового `TtgMarker`, стоит МЕЖДУ
 * абзацами, поэтому продолжение набора уходит в отдельный абзац, а сам маркер
 * сериализуется своим блоком (документ-хендлер разделяет блоки пустой строкой).
 *
 * Рисуется тем же чипом `MarkerChip` (он сам определяет блочность по raw).
 * В Markdown сериализуется дословно из атрибута `raw` — round-trip без потерь.
 */
export const TtgBlockMarker = Node.create({
  name: BLOCK_MARKER_NODE,
  group: 'block',
  atom: true,
  selectable: true,

  markdownTokenName: BLOCK_MARKER_NODE,
  markdownTokenizer: blockMarkerMarkdownTokenizer,
  parseMarkdown: (token) => ({
    type: BLOCK_MARKER_NODE,
    attrs: { raw: String(token.raw ?? '').trim() },
  }),
  renderMarkdown: (node) => String(node.attrs?.raw ?? ''),

  addAttributes() {
    return {
      raw: {
        default: '',
        // У `<hr>` своего текста нет — он и ЕСТЬ наш разделитель (см. правило
        // разбора ниже). Прочие элементы несут разметку маркера текстом.
        parseHTML: (element) =>
          element.tagName.toLowerCase() === HORIZONTAL_RULE_TAG
            ? SEPARATOR_MARKER
            : (element.textContent ?? ''),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: `div[${BLOCK_MARKER_ATTR}]` },
      // Линия из чужого HTML (вставка, перетаскивание) — это `{@separator}`.
      // Приоритет выше дефолтных 50, иначе тег забрал бы себе штатный
      // `HorizontalRule`, узел которого наша разметка выразить не может.
      { tag: HORIZONTAL_RULE_TAG, priority: HORIZONTAL_RULE_PARSE_PRIORITY },
    ];
  },

  renderHTML({ node }) {
    return ['div', { [BLOCK_MARKER_ATTR]: '' }, String(node.attrs.raw ?? '')];
  },

  addNodeView() {
    return VueNodeViewRenderer(MarkerChip);
  },
});
