import type { Editor } from '@tiptap/vue-3';

/**
 * Blueprint атрибута TipTap-узла, зеркалящего значение в DOM data-*-атрибут (для
 * сохранения/copy-paste): JSON хранит поле `attrName`, DOM — `domName`. Пустое
 * значение атрибут не пишет. Общий для узлов таблицы (style/align) и цитаты
 * (color/variant).
 *
 * @param domName - Имя DOM-атрибута (например `data-align`)
 * @param attrName - Имя поля в attrs узла (например `align`)
 */
export function dataAttr(domName: string, attrName: string) {
  return {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute(domName),
    renderHTML: (attributes: Record<string, unknown>) => {
      const value = attributes[attrName];

      return value ? { [domName]: value } : {};
    },
  };
}

/**
 * Есть ли в диапазоне [from, to] атомарный чип-маркер (узел `ttgMarker`).
 * `textBetween` сплющивает такие узлы в пробел и теряет их — поэтому ходим по
 * дереву. Сверяем именно тип узла, а не `isInline && !isText` (последнее ловит и
 * hardBreak/mention, ложно срабатывая на выделении с переносом строки).
 *
 * @param editor - Экземпляр редактора TipTap
 * @param from - Начало диапазона
 * @param to - Конец диапазона
 */
export function hasMarkerAtom(
  editor: Editor,
  from: number,
  to: number,
): boolean {
  let found = false;

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'ttgMarker') {
      found = true;
    }
  });

  return found;
}
