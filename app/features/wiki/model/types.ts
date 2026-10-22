import type { ScreenLink } from './schema';

/** Группа вложенных разделов ширмы; без названия — разделы вне групп. */
export interface ScreenGroup {
  key: string;
  name?: string;
  items: Array<ScreenLink>;
}

/** Узел очищенной SVG-иконки. */
export interface SvgNode {
  tag: string;
  attributes: Record<string, string>;
  children: Array<SvgNode>;
}
