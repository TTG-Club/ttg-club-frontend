import type { VNode } from 'vue';

import type { MarkerType } from './config';

export type MarkerAttributes = Record<string, string | number | boolean | null>;

/** Пользовательский уровень заголовка `{@h}`: 1 — крупный … 4 — минимальный. */
export type HeadingLevel = 1 | 2 | 3 | 4;

// Простой текст
export interface SimpleTextNode {
  type: 'text';
  text: string;
}

// Маркер (включая list, table и всё остальное)
export interface MarkerNode {
  type: MarkerType;
  attrs?: MarkerAttributes;
  content?: RenderNode[];
}

// Union всех нод
export type RenderNode =
  | string
  | SimpleTextNode
  | MarkerNode
  | Array<string | SimpleTextNode | MarkerNode>;

export interface Group {
  id: number;
  isBlock: boolean;
  /** Тип блочного маркера группы — см. `RenderGroup` в `renderer.ts`. */
  blockType?: string;
  /** Классы вертикальной отбивки группы от соседей (считает MarkupRender). */
  spacingClass: string;
  vnodes: VNode[];
}

export interface RenderResult {
  isSingle: boolean;
  vnodes?: VNode[];
  groups?: Group[];
}
