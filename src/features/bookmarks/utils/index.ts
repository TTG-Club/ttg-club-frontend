import type { Ref } from 'vue';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import type {
    IBookmarkCategory,
    IBookmarkGroup,
    IBookmarkItem,
    TBookmark,
    TWithChildren
} from '@/features/bookmarks/types/Bookmark.types';

export const isBookmarkItem = (item: TBookmark): item is IBookmarkItem => (('url' in item) && ('parentUUID' in item));

export const isBookmarkCategory = (item: TBookmark): item is IBookmarkCategory => (
    !('url' in item) && ('parentUUID' in item)
);

export const isBookmarkGroup = (item: TBookmark): item is IBookmarkGroup => (
    !('url' in item) && !('parentUUID' in item)
);

export const getGroupBookmarks = ({
    groups,
    categories,
    bookmarks
}: {
    groups: Ref<IBookmarkGroup[]>;
    categories: Ref<IBookmarkCategory[]>;
    bookmarks: Ref<IBookmarkItem[]>;
}) => sortBy(
    groups.value.map<TWithChildren<IBookmarkGroup, IBookmarkCategory>>(group => ({
        ...group,
        children: sortBy(
            categories.value
                .filter(category => category.parentUUID === group.uuid)
                .map<TWithChildren<IBookmarkCategory, IBookmarkItem>>(category => ({
                    ...category,
                    children: sortBy(
                        bookmarks.value.filter(bookmark => (
                            bookmark.parentUUID === category.uuid
                        )),
                        [o => o.order]
                    )
                })),
            [o => o.order]
        )
    })),
    [o => o.order]
);

export const setBookmarks = ({
    items,
    groups,
    categories,
    bookmarks
}: {
    items: TBookmark[];
    groups: Ref<IBookmarkGroup[]>;
    categories: Ref<IBookmarkCategory[]>;
    bookmarks: Ref<IBookmarkItem[]>;
}) => {
    const newGroups: IBookmarkGroup[] = [];
    const newCategories: IBookmarkCategory[] = [];
    const newBookmarks: IBookmarkItem[] = [];

    for (const item of items) {
        if (isBookmarkGroup(item)) {
            newGroups.push(item);

            continue;
        }

        if (isBookmarkCategory(item)) {
            newCategories.push(item);

            continue;
        }

        if (isBookmarkItem(item)) {
            newBookmarks.push(item);

            continue;
        }

        console.error(`Unknown bookmark type: ${ JSON.stringify(item) }`);
    }

    // eslint-disable-next-line no-param-reassign
    groups.value = cloneDeep(newGroups);
    // eslint-disable-next-line no-param-reassign
    categories.value = cloneDeep(newCategories);
    // eslint-disable-next-line no-param-reassign
    bookmarks.value = cloneDeep(newBookmarks);
};
