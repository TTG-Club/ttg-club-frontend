/** Тело запроса поиска, как у списков разделов. */
export interface SearchRequest {
  page: number;
  size: number;
  search: { value: string; exact: boolean };
  order: Array<never>;
}

/** Номера показанных результатов: «21–40 из 57». */
export interface SearchRange {
  from: number;
  to: number;
}
