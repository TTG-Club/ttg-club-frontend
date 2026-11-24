import { Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

import MarkerChip from './MarkerChip.vue';
import { markerMarkdownTokenizer } from './marks';

/**
 * Атомарный inline-узел для НЕформатирующих маркеров {@...} (интерактив, ссылки,
 * бейджи, атрибутные и т.п.). В визуальном режиме рисуется чипом (NodeView
 * `MarkerChip`); в Markdown сериализуется дословно из атрибута `raw` — round-trip
 * без потери данных даже при неточном рендере чипа.
 *
 * Форматирующие маркеры ({@i}/{@b}/…) обрабатываются НЕ здесь, а марками из
 * `marks.ts`: общий `markerMarkdownTokenizer` при загрузке разводит их (форматные
 * → токен марки, остальные → токен `ttgMarker`, который парсит этот узел).
 */
export const TtgMarker = Node.create({
  name: 'ttgMarker',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  markdownTokenName: 'ttgMarker',
  markdownTokenizer: markerMarkdownTokenizer,
  parseMarkdown: (token) => ({
    type: 'ttgMarker',
    attrs: { raw: token.raw ?? '' },
  }),
  renderMarkdown: (node) => String(node.attrs?.raw ?? ''),

  addAttributes() {
    return {
      raw: {
        default: '',
        parseHTML: (element) => element.textContent ?? '',
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ttg-marker]' }];
  },

  renderHTML({ node }) {
    return ['span', { 'data-ttg-marker': '' }, String(node.attrs.raw ?? '')];
  },

  addNodeView() {
    return VueNodeViewRenderer(MarkerChip);
  },
});
