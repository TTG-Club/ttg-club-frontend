/** Ответ бэкенда в том виде, в каком его достаточно отдать посетителю. */
export interface CatalogResponse {
  /** Код ответа бэкенда. */
  status: number;
  /** Тело ответа как есть, без разбора. */
  body: string;
  /** Тип содержимого из ответа бэкенда. */
  contentType: string;
}

/** Что стало с запросом каталога: ответ взят из кэша или запрошен заново. */
export type CatalogCacheState = 'hit' | 'miss';

/** Ответ каталога вместе с тем, откуда он взят. */
export interface ResolvedCatalogResponse {
  response: CatalogResponse;
  state: CatalogCacheState;
}

/** Запрос каталога, за ответом на который сервер сайта идёт в бэкенд. */
export interface CatalogRequest {
  /** Ключ записи кэша. */
  cacheKey: string;
  /** Полный адрес бэкенда, куда уходит запрос. */
  target: string;
  /** Тело запроса как есть; у чтения через GET его нет. */
  body: string | undefined;
}
