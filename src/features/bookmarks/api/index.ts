import { useAxios } from '@/common/composition/useAxios';
import type { IBookmarkCategoryInfo } from '@/features/bookmarks/types/Bookmark.types';
import type { Maybe } from '@/types/Shared/Utility.types';

export default class BookmarksApi {
    private static $http = useAxios();

    static async getCategoryByURL(url: string) {
        try {
            const resp = await this.$http.get<Maybe<IBookmarkCategoryInfo>>({
                url: '/bookmarks/category',
                payload: {
                    url: encodeURIComponent(url)
                }
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static async getCategoryByCode(code: string) {
        try {
            const resp = await this.$http.get<Maybe<IBookmarkCategoryInfo>>({
                url: '/bookmarks/category',
                payload: { code }
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static getCategory({ code, url }: {code?: Maybe<string>, url?: Maybe<string>}) {
        if (code) {
            return this.getCategoryByCode(code);
        }

        if (url) {
            return this.getCategoryByURL(url);
        }

        return Promise.reject(new Error('Method must have code or url'));
    }

    static async getCategories() {
        try {
            const resp = await this.$http.get<Array<IBookmarkCategoryInfo>>({
                url: '/bookmarks/categories'
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}
