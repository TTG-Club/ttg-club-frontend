import cloneDeep from 'lodash/cloneDeep';
import { useAxios } from '@/common/composition/useAxios';
import type {
  IBookmarkCategoryInfo, TBookmark, TQueryAddBookmark
} from '@/features/bookmarks/types/Bookmark.types';
import type { Maybe } from '@/types/Shared/Utility.types';

export default class BookmarksApi {
  private static $http = useAxios();

  static getCategoryByURL(url: string) {
    return this.$http.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: {
        url: encodeURIComponent(url)
      }
    });
  }

  static getCategoryByCode(code: string) {
    return this.$http.get<Maybe<IBookmarkCategoryInfo>>({
      url: '/bookmarks/category',
      payload: { code }
    });
  }

  static getCategory({
    code,
    url
  }: { code?: Maybe<string>, url?: Maybe<string> }) {
    if (code) {
      return this.getCategoryByCode(code);
    }

    if (url) {
      return this.getCategoryByURL(url);
    }

    return Promise.reject(new Error('Method must have code or url'));
  }

  static getCategories() {
    return this.$http.get<Array<IBookmarkCategoryInfo>>({
      url: '/bookmarks/categories'
    });
  }

  static getBookmarks() {
    return this.$http.get<Array<TBookmark>>({
      url: '/bookmarks'
    });
  }

  static addBookmark<T>(payload: TQueryAddBookmark) {
    return this.$http.post<T>({
      url: '/bookmarks',
      payload: cloneDeep(payload)
    });
  }

  static updateBookmark(payload: TBookmark) {
    return this.$http.put({
      url: '/bookmarks',
      payload: cloneDeep(payload)
    });
  }

  static deleteBookmark(uuid: TBookmark['uuid']) {
    return this.$http.delete({
      url: `/bookmarks/${ uuid }`
    });
  }
}
