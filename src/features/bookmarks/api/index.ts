import { useAxios } from '@/common/composition/useAxios';
import type { IBookmark } from '@/features/bookmarks/types/Bookmark.types';

export default class BookmarksApi {
    $http = useAxios();

    async getCategoryByURL(url: string) {
        try {
            const resp = await this.$http.get<Array<IBookmark>>({
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

    async getCategoryByCode(code: string) {
        try {
            const resp = await this.$http.get<Array<IBookmark>>({
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

    async getCategories() {
        try {
            const resp = await this.$http.get<Array<IBookmark>>({
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
