import type { TName } from '@/shared/types/BaseApiFields';

export interface ITokenItem {
  id: number;
  ref: number;
  name: TName;
  type: 'круглый' | 'вид сверху';
  url: string;
}
