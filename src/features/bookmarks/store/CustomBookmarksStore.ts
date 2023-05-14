import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import { computed, ref } from 'vue';
import type {
  IBookmarkCategory,
  IBookmarkCategoryInfo,
  IBookmarkGroup,
  IBookmarkItem,
  TBookmark,
  TQueryAddBookmark
} from '@/features/bookmarks/types/Bookmark.types';
import BookmarksApi from '@/features/bookmarks/api';
import { getGroupBookmarks, setBookmarks } from '@/features/bookmarks/utils';

const SESSION_OPENED_GROUPS_KEY = 'dnd5club_opened_bookmark_groups';

export const useCustomBookmarkStore = defineStore('CustomBookmarkStore', () => {
  const groups = ref<IBookmarkGroup[]>([]);
  const categories = ref<IBookmarkCategory[]>([]);
  const bookmarks = ref<IBookmarkItem[]>([]);

  const openedGroups = ref<IBookmarkGroup['uuid'][]>([]);

  const isAllGroupsOpened = computed(() => (openedGroups.value.length === groups.value.length));

  const isGroupOpened = (uuid: IBookmarkGroup['uuid']) => openedGroups.value.includes(uuid);

  const isBookmarkSaved = (url: IBookmarkItem['url']) => bookmarks.value
    .findIndex(bookmark => bookmark.url === url) > -1;

  const isBookmarkSavedInDefault = (url: IBookmarkItem['url']) => {
    const defaultGroup = groups.value.find(item => item.order === -1);

    if (!defaultGroup) {
      return undefined;
    }

    const categoriesUUIDs = categories.value
      .filter(item => item.parentUUID === defaultGroup.uuid)
      .map(item => item.uuid);

    return bookmarks.value
      .findIndex(item => (categoriesUUIDs.includes(item.parentUUID) && item.url === url)) > -1;
  };

  const isBookmarkSavedInGroup = (url: IBookmarkItem['url'], groupUUID: IBookmarkGroup['uuid']) => {
    const categoriesUUIDs = categories.value
      .filter(item => item.parentUUID === groupUUID)
      .map(item => item.uuid);

    return bookmarks.value
      .findIndex(item => categoriesUUIDs.includes(item.parentUUID) && item.url === url) > -1;
  };

  const getGroups = computed(() => sortBy(groups.value, [o => o.order]));

  const queryGetBookmarks = async (): Promise<TBookmark[]> => {
    try {
      const { data: items } = await BookmarksApi.getBookmarks();

      setBookmarks({
        items,
        groups,
        categories,
        bookmarks
      });

      return items;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const queryAddBookmark = async <T>(queryBookmark: TQueryAddBookmark): Promise<T> => {
    try {
      if (!queryBookmark?.name) {
        return Promise.reject(new Error('Name is undefined'));
      }

      const { data } = await BookmarksApi.addBookmark<T>(queryBookmark);

      await queryGetBookmarks();

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const queryUpdateBookmark = async (bookmark: TBookmark) => {
    try {
      if (!bookmark?.name) {
        return Promise.reject(new Error('Name is undefined'));
      }

      const { data } = await BookmarksApi.updateBookmark(bookmark);

      await queryGetBookmarks();

      return data;
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const queryDeleteBookmark = async (uuid: TBookmark['uuid']) => {
    try {
      if (!uuid) {
        return Promise.reject(new Error('UUID is undefined'));
      }

      await BookmarksApi.deleteBookmark(uuid);
      await queryGetBookmarks();

      if (openedGroups.value.includes(uuid)) {
        openedGroups.value = openedGroups.value.filter(item => item !== uuid);
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const createDefaultGroup = () => queryAddBookmark<IBookmarkGroup>({
    name: 'Общие',
    order: -1
  });

  const getDefaultGroup = async () => {
    try {
      await queryGetBookmarks();

      return groups.value.find(bookmark => bookmark.order === -1) || await createDefaultGroup();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const createCategory = (
    category: IBookmarkCategoryInfo,
    groupUUID: TBookmark['uuid']
  ) => queryAddBookmark<IBookmarkCategory>({
    name: category.name,
    parentUUID: groupUUID
  });

  const getCategoryInGroup = async ({
    url,
    groupUUID
  }: {
        url?: IBookmarkItem['url'];
        groupUUID: IBookmarkGroup['uuid'];
    }) => {
    try {
      const { data: cat } = await BookmarksApi.getCategory({ url });

      if (!cat) {
        return Promise.reject();
      }

      return categories.value.find(category => (
        category.name === cat.name
                    && category.parentUUID === groupUUID
      )) || await createCategory(cat, groupUUID);
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const addBookmarkInGroup = async ({
    url,
    name,
    groupUUID
  }: {
        url: IBookmarkItem['url'];
        name: TBookmark['name'];
        groupUUID: IBookmarkGroup['uuid']
    }) => {
    try {
      if (!url || !name) {
        return Promise.reject();
      }

      const savedCat = await getCategoryInGroup({
        url,
        groupUUID
      });

      return queryAddBookmark<IBookmarkItem>({
        url,
        name,
        parentUUID: savedCat.uuid
      });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const getSavedBookmarkInGroup = async ({
    url,
    groupUUID
  }: {
        url: IBookmarkItem['url'];
        groupUUID: IBookmarkGroup['uuid']
    }) => {
    try {
      await queryGetBookmarks();
    } catch (err) {
      return Promise.reject(err);
    }

    const categoriesUUIDs = categories.value
      .filter(item => item.parentUUID === groupUUID)
      .map(item => item.uuid);

    return bookmarks.value
      .find(item => item.url === url && (item.parentUUID && categoriesUUIDs.includes(item.parentUUID)));
  };

  const updateBookmarkInGroup = async ({
    url,
    name,
    groupUUID
  }: {
        url: IBookmarkItem['url'];
        name: TBookmark['name'];
        groupUUID: IBookmarkGroup['uuid']
    }) => {
    try {
      const bookmark = await getSavedBookmarkInGroup({
        url,
        groupUUID
      });

      if (bookmark) {
        return queryDeleteBookmark(bookmark.uuid);
      }

      return addBookmarkInGroup({
        url,
        name,
        groupUUID
      });
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const clearBookmarks = () => {
    bookmarks.value = [];
  };

  const restoreOpenedGroupsFromSession = () => {
    const sessionState = sessionStorage.getItem(SESSION_OPENED_GROUPS_KEY);

    let parsed = [];

    if (sessionState) {
      parsed = JSON.parse(sessionState);
    }

    openedGroups.value = parsed;
  };

  const updateSessionStorage = () => {
    if (openedGroups.value.length) {
      sessionStorage.setItem(SESSION_OPENED_GROUPS_KEY, JSON.stringify(openedGroups.value));

      return;
    }

    sessionStorage.removeItem(SESSION_OPENED_GROUPS_KEY);
  };

  const toggleGroup = (uuid: TBookmark['uuid']) => {
    const isOpened = openedGroups.value.includes(uuid);

    if (isOpened) {
      openedGroups.value = openedGroups.value.filter(item => item !== uuid);

      updateSessionStorage();

      return;
    }

    if (!isOpened) {
      openedGroups.value.push(uuid);

      updateSessionStorage();
    }
  };

  const toggleAll = () => {
    if (!openedGroups.value.length || groups.value.length > openedGroups.value.length) {
      openedGroups.value = groups.value.map(group => group.uuid);

      updateSessionStorage();

      return;
    }

    openedGroups.value = [];

    updateSessionStorage();
  };

  return {
    groups,
    categories,
    bookmarks,
    openedGroups,

    isGroupOpened,
    isAllGroupsOpened,
    isBookmarkSaved,
    isBookmarkSavedInDefault,
    isBookmarkSavedInGroup,

    getGroupBookmarks: computed(() => getGroupBookmarks({
      groups,
      categories,
      bookmarks
    })),
    getGroups,

    queryGetBookmarks,
    queryAddBookmark,
    queryUpdateBookmark,
    queryDeleteBookmark,
    createDefaultGroup,
    getDefaultGroup,
    createCategory,
    getCategoryInGroup,
    addBookmarkInGroup,
    getSavedBookmarkInGroup,
    updateBookmarkInGroup,
    clearBookmarks,
    restoreOpenedGroupsFromSession,
    toggleGroup,
    toggleAll
  };
});
