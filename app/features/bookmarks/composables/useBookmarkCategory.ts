import type { BookmarkCategoryInfo } from '../model';

import { BOOKMARK_CATEGORY_PATH, bookmarkCategorySchema } from '../model';

/**
 * Узнаёт у API категорию закладки по адресу страницы: «Заклинания»,
 * «Бестиарий» и т.п.
 * @param url - адрес страницы
 */
export async function fetchBookmarkCategory(
  url: string,
): Promise<BookmarkCategoryInfo> {
  const api = useApi();

  const response: unknown = await api(BOOKMARK_CATEGORY_PATH, {
    query: { url },
  });

  return bookmarkCategorySchema.parse(response);
}
