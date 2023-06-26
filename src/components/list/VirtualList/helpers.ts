import type { TVirtualListProps } from '@/components/list/VirtualList/types';
import { DEFAULT_ENTITY_KEY_FIELD } from '@/common/const';

const itemSizes = {
  small: 55,
  medium: 66
} as const;

export const getListProps = (base: TVirtualListProps & {size?: keyof typeof itemSizes}): TVirtualListProps => {
  const { size, ...other } = base;

  return {
    keyField: DEFAULT_ENTITY_KEY_FIELD,
    minItemSize: size ? itemSizes[size] : undefined,
    ...other
  };
};
