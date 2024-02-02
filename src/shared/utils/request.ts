import type { IOrderItem } from '@/shared/types/BaseApiFields';

export const getOrderString = (orders: Array<IOrderItem>) =>
  orders.map((order) => `${order.field} ${order.direction}`).join(',');
