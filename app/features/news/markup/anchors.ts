import type { MarkerNode } from './types';

import { HEADING_ANCHOR_ATTRIBUTE } from './consts';

/**
 * Читает id якоря из атрибутов заголовка. Оглавления у новостей нет, но
 * якорь может прийти в разметке готовым — тогда заголовок его получает.
 *
 * @param node - Узел заголовка
 * @returns Id якоря или `undefined`, если заголовку якорь не нужен
 */
export function getHeadingAnchor(node: MarkerNode): string | undefined {
  const anchor = node.attrs?.[HEADING_ANCHOR_ATTRIBUTE];

  return typeof anchor === 'string' && anchor ? anchor : undefined;
}
