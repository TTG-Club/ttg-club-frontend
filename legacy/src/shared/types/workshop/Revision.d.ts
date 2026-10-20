export type TRevisionOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface TRevisionInfo {
  revision: number;
  operation: TRevisionOperation;
  userId?: number;
  username: string;
  createdAt: string;
}
