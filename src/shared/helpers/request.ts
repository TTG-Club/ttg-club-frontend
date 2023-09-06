import type { IOrderItem } from '@/shared/types/BaseApiFields';

export const getBaseURL = (url = '') => {
  const devPrefix = import.meta.env.DEV ? '/proxy' : '';

  return `${devPrefix}${url}`;
};

export const getOrderString = (orders: Array<IOrderItem>) =>
  orders.map(order => `${order.field} ${order.direction}`).join(',');
