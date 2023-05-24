import type { Ref } from 'vue';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import type {
  IBookmarkCategory,
  IBookmarkGroup,
  IBookmarkItem,
  TBookmark
} from '@/features/bookmarks/types/Bookmark.types';
import type { WithChildren } from '@/types/Shared/Utility.types';

export const isBookmarkItem = (item: TBookmark): item is IBookmarkItem => (('url' in item) && ('parentUUID' in item));

export const isBookmarkCategory = (item: TBookmark): item is IBookmarkCategory => (
  !('url' in item) && ('parentUUID' in item)
);

export const isBookmarkGroup = (item: TBookmark): item is IBookmarkGroup => (
  !('url' in item) && !('parentUUID' in item)
);

/**
 * Метод обходит все группы, добавляет в них поле children и кладет туда категории (заклинания, классы, черты и т.д.).
 * С каждой категорией происходит то же самое - в нее кладутся все дочерние закладки.
 *
 * @param {Ref<Array<IBookmarkGroup>>} groups
 * @param {Ref<Array<IBookmarkCategory>>} categories
 * @param {Ref<Array<IBookmarkItem>>} bookmarks
 */
export const getGroupBookmarks = ({
  groups,
  categories,
  bookmarks
}: {
    groups: Ref<IBookmarkGroup[]>;
    categories: Ref<IBookmarkCategory[]>;
    bookmarks: Ref<IBookmarkItem[]>;
}) => sortBy(
  groups.value.map<WithChildren<IBookmarkGroup, IBookmarkCategory>>(group => ({
    ...group,
    children: sortBy(
      categories.value
        .filter(category => category.parentUUID === group.uuid)
        .map<WithChildren<IBookmarkCategory, IBookmarkItem>>(category => ({
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