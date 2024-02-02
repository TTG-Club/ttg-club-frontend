import { cloneDeep } from 'lodash-es';

import { useAxios } from '@/shared/composables/useAxios';
import type { Maybe } from '@/shared/types/Utility';

import type {
  IBookmarkCategoryInfo,
  TBookmark,
  TQueryAddBookmark,
} from '@/features/bookmarks/types/Bookmark.d';

export default class BookmarksApi {
  static getCategoryByURL(url: string) {
    const http = useAxios();

    return http.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: {
        url: encodeURIComponent(url),
      },
    });
  }

  static getCategoryByCode(code: string) {
    const http = useAxios();

    return http.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: { code },
    });
  }

  static getCategory({
    code,
    url,
  }: {
    code?: Maybe<string>;
    url?: Maybe<string>;
  }) {
    if (code) {
      return this.getCategoryByCode(code);
    }

    if (url) {
      return this.getCategoryByURL(url);
    }

    return Promise.reject(new Error('Method must have code or url'));
  }

  static getCategories() {
    const http = useAxios();

    return http.get<Array<IBookmarkCategoryInfo>>({
      url: '/bookmarks/categories',
    });
  }

  static getBookmarks() {
    const http = useAxios();

    return http.get<Array<TBookmark>>({
      url: '/bookmarks',
    });
  }

  static addBookmark<T>(payload: TQueryAddBookmark) {
    const http = useAxios();

    return http.post<T>({
      url: '/bookmarks',
      payload: cloneDeep(payload),
    });
  }

  static updateBookmark(payload: TBookmark) {
    const http = useAxios();

    return http.put({
      url: '/bookmarks',
      payload: cloneDeep(payload),
    });
  }

  static deleteBookmark(uuid: TBookmark['uuid']) {
    const http = useAxios();

    return http.delete({
      url: `/bookmarks/${uuid}`,
    });
  }
}
