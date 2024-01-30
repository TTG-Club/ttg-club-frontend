import { cloneDeep } from 'lodash-es';

import type {
  IBookmarkCategoryInfo,
  TBookmark,
  TQueryAddBookmark
} from '@/features/bookmarks/types/Bookmark.d';

import { httpClient } from '@/shared/api/httpClient';
import type { Maybe } from '@/shared/types/Utility';

export default class BookmarksApi {
  static getCategoryByURL(url: string) {
    return httpClient.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: {
        url: encodeURIComponent(url)
      }
    });
  }

  static getCategoryByCode(code: string) {
    return httpClient.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: { code }
    });
  }

  static getCategory({
    code,
    url
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
    return httpClient.get<Array<IBookmarkCategoryInfo>>({
      url: '/bookmarks/categories'
    });
  }

  static getBookmarks() {
    return httpClient.get<Array<TBookmark>>({
      url: '/bookmarks'
    });
  }

  static addBookmark<T>(payload: TQueryAddBookmark) {
    return httpClient.post<T>({
      url: '/bookmarks',
      payload: cloneDeep(payload)
    });
  }

  static updateBookmark(payload: TBookmark) {
    return httpClient.put({
      url: '/bookmarks',
      payload: cloneDeep(payload)
    });
  }

  static deleteBookmark(uuid: TBookmark['uuid']) {
    return httpClient.delete({
      url: `/bookmarks/${uuid}`
    });
  }
}
