import type {
    IBookmarkCategory,
    IBookmarkGroup,
    IBookmarkItem,
    TBookmark
} from '@/features/bookmarks/types/Bookmark.types';

const isBookmarkItem = (item: TBookmark): item is IBookmarkItem => (('url' in item) && ('parentUUID' in item));

const isBookmarkCategory = (item: TBookmark): item is IBookmarkCategory => (
    !('url' in item) && ('parentUUID' in item)
);

const isBookmarkGroup = (item: TBookmark): item is IBookmarkGroup => (
    !('url' in item) && !('parentUUID' in item)
);

export {
    isBookmarkItem,
    isBookmarkCategory,
    isBookmarkGroup
};
