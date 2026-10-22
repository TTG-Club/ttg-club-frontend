import type { ContentNode, ContentRenderItem, DetailType } from './types';

import {
  DETAIL_TOOLTIP_TAG,
  DETAIL_TYPES,
  DICE_ROLLER_TAG,
  FEAT_DETAIL_TYPES,
  VOID_TAGS,
} from './constants';
import { findFirstHref, getNodesText, hasAnyAttribute } from './parse';

/**
 * Проверяет, что строка — известный тип подсказки.
 * @param value - значение атрибута `type`
 */
export function isDetailType(value: string | undefined): value is DetailType {
  return value !== undefined && DETAIL_TYPES.has(value);
}

/**
 * Проверяет, что подсказка ведёт на черту: старый тип `trait` открывает
 * ту же карточку, что и `feat`.
 * @param type - тип подсказки
 */
export function isFeatDetailType(type: DetailType): boolean {
  return FEAT_DETAIL_TYPES.has(type);
}

/**
 * Готовит узел контента к выводу: кастомные теги превращаются в описание
 * компонента с пропсами, ссылки отделяются от обычных тегов.
 * @param node - узел после очистки
 */
export function toRenderItem(node: ContentNode): ContentRenderItem {
  if (node.kind === 'text') {
    return node;
  }

  const { tag, attributes, children } = node;

  if (tag === DICE_ROLLER_TAG && attributes.formula) {
    return {
      kind: 'dice',
      props: {
        formula: attributes.formula,
        label: attributes.label,
        source: attributes.source,
        isAdvantage: hasAnyAttribute(attributes, [
          'is-advantage',
          'isadvantage',
        ]),
        isDisadvantage: hasAnyAttribute(attributes, [
          'is-disadvantage',
          'isdisadvantage',
        ]),
        isSavingThrow: hasAnyAttribute(attributes, [
          'is-saving-throw',
          'issavingthrow',
        ]),
      },
      children,
    };
  }

  if (tag === DETAIL_TOOLTIP_TAG) {
    return {
      kind: 'tooltip',
      props: {
        type: isDetailType(attributes.type) ? attributes.type : undefined,
        url: attributes.url || findFirstHref(children),
        title: getNodesText(children).trim(),
      },
      children,
    };
  }

  // Бросок без формулы выводится как его текст.
  if (tag === DICE_ROLLER_TAG) {
    return { kind: 'fragment', children };
  }

  if (tag === 'a' && attributes.href) {
    const { href, ...rest } = attributes;

    return { kind: 'link', href, attributes: rest, children };
  }

  if (VOID_TAGS.has(tag)) {
    return { kind: 'void', tag, attributes };
  }

  return { kind: 'element', tag, attributes, children };
}
