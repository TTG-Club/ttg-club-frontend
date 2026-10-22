/** Текстовый узел HTML-контента. */
export interface ContentTextNode {
  kind: 'text';
  text: string;
}

/** Элемент HTML-контента после очистки: только разрешённые тег и атрибуты. */
export interface ContentElementNode {
  kind: 'element';
  tag: string;
  attributes: Record<string, string>;
  children: Array<ContentNode>;
}

export type ContentNode = ContentElementNode | ContentTextNode;

/** Тип сущности в подсказке `detail-tooltip`, как в старом SPA. */
export type DetailType =
  | 'option'
  | 'trait'
  | 'feat'
  | 'armor'
  | 'weapon'
  | 'magic-item'
  | 'item'
  | 'screen'
  | 'creature'
  | 'spell'
  | 'god';

/** Таблица бросков: первая колонка — диапазон результатов. */
export interface RollTableData {
  name: string;
  formula: string;
  thead: Array<string>;
  tbody: Array<Array<string>>;
}

/** Пропсы броска кубиков, собранные из атрибутов `dice-roller`. */
export interface DiceRollerProps {
  formula: string;
  label?: string;
  source?: string;
  isAdvantage: boolean;
  isDisadvantage: boolean;
  isSavingThrow: boolean;
}

/** Пропсы подсказки сущности, собранные из атрибутов `detail-tooltip`. */
export interface DetailTooltipProps {
  type?: DetailType;
  url?: string;
  /** Текст ссылки: заголовок дровера, пока запись грузится. */
  title: string;
}

/** Узел контента, готовый к выводу. */
export type ContentRenderItem =
  | ContentTextNode
  | { kind: 'dice'; props: DiceRollerProps; children: Array<ContentNode> }
  | { kind: 'tooltip'; props: DetailTooltipProps; children: Array<ContentNode> }
  | {
      kind: 'link';
      href: string;
      attributes: Record<string, string>;
      children: Array<ContentNode>;
    }
  | { kind: 'void'; tag: string; attributes: Record<string, string> }
  | { kind: 'fragment'; children: Array<ContentNode> }
  | {
      kind: 'element';
      tag: string;
      attributes: Record<string, string>;
      children: Array<ContentNode>;
    };
