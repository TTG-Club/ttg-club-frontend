import type { AnyObject, Maybe } from '@/shared/types/Utility';

export type TVirtualListProps = {
  items: AnyObject[];
  keyField?: string;
  minItemSize?: number;
  pageMode?: boolean;
  buffer?: number;

  /**
   * Функция для получения класса элемента списка
   */
  getItemClass?: (item: unknown) => Maybe<string>;

  /**
   * Функция для получения индекса элемента списка по ключу
   */
  getItemIndexByKey?: (items: AnyObject[], key: string) => Maybe<AnyObject>;
};

export type TVirtualListRef = {
  /**
   * Реф виртуального списка для доступа к его API
   */
  scroller: Record<string, any>;

  /**
   * Функция для прокрутки списка к элементу по ключу
   */
  scrollToItemByKey: (key: string) => { scrolled: boolean; index: number };
};
