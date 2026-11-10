import type { RenderNode } from '../markup';

/**
 * Вид новости нового сайта:
 * - `site` — новость редакции (`/api/v2/articles`, тип `NEWS`);
 * - `community` — новость сообщества (`/api/v2/community-news`).
 */
export type NewsKind = 'site' | 'community';

/** Откуда берётся новость данного вида и где она живёт на новом сайте. */
export interface NewsKindConfig {
  /** Путь API core-api без завершающего слэша */
  apiPath: string;
  /** Дополнительные параметры поиска свежих новостей */
  searchQuery: Record<string, string>;
  /** Путь страницы новости на новом сайте, к нему добавляется слаг */
  pagePath: string;
  /** Путь списка всех новостей этого вида на новом сайте */
  listPath: string;
}

/** Новость в ленте главной: короткий ответ `/search`. */
export interface NewsShort {
  id: string;
  url: string;
  title: string;
  /** Подпись типа записи («Новость»); у новостей сообщества нет */
  typeName: string | null;
  /** Автор; есть только у новостей сообщества */
  authorName: string | null;
  previewImageUrl: string | null;
  videoUrl: string | null;
  publishDateTime: string | null;
  /** Анонс; бывает как разобранной разметкой, так и сырой JSON-строкой */
  preview: RenderNode;
}

/** Полная новость для чтения в панели: ответ `GET /{url}`. */
export interface NewsDetailed extends NewsShort {
  /** Ссылка на первоисточник; есть только у новостей сообщества */
  sourceUrl: string | null;
  content: RenderNode;
}
