import type { TVirtualListProps } from '@/components/list/VirtualList/types';
import type { TResponsiveValues } from '@/common/composition/useResponsiveValues';
import type { TListRow } from '@/types/Shared/List.types';
import type { AnyObject, RecordKey } from '@/types/Shared/Utility.types';
import type { RefFunction } from '@/common/composition/useReference';

export type TVirtualGridListContext = {
  columns: number;
  keyField: TVirtualListProps['keyField']
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
  getRows?: (items: TItem[], context: TVirtualGridListContext) => TListRow<TItem, RecordKey>[];

  /**
   * Ref-функция для доступа к внутреннему API компонента списка
   */
  reference?: RefFunction<never>;
}

export type TVirtualGridListBaseProps = Omit<TVirtualGridListProps, 'list'>;
