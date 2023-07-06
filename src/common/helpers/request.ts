import type { IOrderItem } from '@/types/Shared/BaseApiFields.types';

export const getBaseURL = (url = '') => {
  const devPrefix = import.meta.env.DEV ? '/proxy' : '';

  return `${ devPrefix }${ url }`;
};

export const getOrderString = (orders: Array<IOrderItem>) => (
  orders.map(order => `${ order.field } ${ order.direction }`).join(',')
);
