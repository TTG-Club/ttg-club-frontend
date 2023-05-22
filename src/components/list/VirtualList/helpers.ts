import type { TVirtualListProps } from '@/components/list/VirtualList/types';
import { DEFAULT_ENTITY_KEY_FIELD } from '@/common/const';

export const getListProps = (base: TVirtualListProps): TVirtualListProps => ({
  keyField: DEFAULT_ENTITY_KEY_FIELD,
  ...base
});
