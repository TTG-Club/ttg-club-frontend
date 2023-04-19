import type {
    IBookmarkCategoryApi,
    IBookmarkGroupApi,
    IBookmarkItemApi
} from '@/features/bookmarks/types/Bookmark.types';

const isBookmarkItemApi = (item:
        | IBookmarkItemApi
        | IBookmarkCategoryApi
        | IBookmarkGroupApi) => (('url' in item) && ('parentUUID' in item));

const isBookmarkCategoryApi = (item:
    | IBookmarkItemApi
    | IBookmarkCategoryApi
    | IBookmarkGroupApi) => (!('url' in item) && ('parentUUID' in item));

const isBookmarkGroupApi = (item:
    | IBookmarkItemApi
    | IBookmarkCategoryApi
    | IBookmarkGroupApi) => (!('url' in item) && !('parentUUID' in item));

export {
    isBookmarkItemApi,
    isBookmarkCategoryApi,
    isBookmarkGroupApi
};
