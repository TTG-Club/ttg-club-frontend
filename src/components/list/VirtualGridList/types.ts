import type { RefFunction } from '@/shared/composition/useReference';
import type { TResponsiveValues } from '@/shared/composition/useResponsiveValues';
import type { TListRow } from '@/shared/types/List';
import type { AnyObject, RecordKey } from '@/shared/types/Utility';

import type { TVirtualListProps } from '@/components/list/VirtualList/types';

export type TVirtualGridListContext = {
  columns: number;
  keyField: TVirtualListProps['keyField'];
};

/* TODO: Добавить generic-типизацию по выходу Vue 3.3 */
type TItem = AnyObject;

export type TVirtualGridListProps = {
  /**
   * Конфигурация списка
   */
  list: TVirtualListProps;

  /**
   * Конфигурация колонок в списке
   */
  columns?: TResponsiveValues<number>;

  /**
   * Флаг, указывающий на то, что список является плоским
   */
  flat?: boolean;

  /**
   * Функция для получения строк списка - по умолчанию используется функция getListRows
   */
  getRows?: (
    items: TItem[],
    context: TVirtualGridListContext
  ) => TListRow<TItem, RecordKey>[];

  /**
   * Ref-функция для доступа к внутреннему API компонента списка
   */
  reference?: RefFunction<never>;
};

export type TVirtualGridListBaseProps = Omit<TVirtualGridListProps, 'list'>;
