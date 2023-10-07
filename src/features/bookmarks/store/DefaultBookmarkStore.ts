import localforage from 'localforage';
import { cloneDeep, isArray } from 'lodash-es';
import { defineStore } from 'pinia';
import { v4 as uuidV4 } from 'uuid';
import { computed, ref } from 'vue';
import { useModal } from 'vue-final-modal';

import BookmarksApi from '@/features/bookmarks/api';
import BookmarkRemoveConfirmationModal from '@/features/bookmarks/components/BookmarkRemoveConfirmationModal.vue';
import type {
  IBookmarkCategory,
  IBookmarkCategoryInfo,
  IBookmarkGroup,
  IBookmarkItem,
  TBookmark
} from '@/features/bookmarks/types/Bookmark.d';
import { getGroupBookmarks, setBookmarks } from '@/features/bookmarks/utils';

import { DB_NAME } from '@/shared/constants/UI';
import { errorHandler } from '@/shared/helpers/errorHandler';

export const useDefaultBookmarkStore = defineStore(
  'DefaultBookmarkStore',
  () => {
    const { open, close, patchOptions } = useModal({
      defaultModelValue: false,
      component: BookmarkRemoveConfirmationModal
    });

    const store = localforage.createInstance({
      name: DB_NAME,
      storeName: 'bookmarks'
    });

    const groups = ref<IBookmarkGroup[]>([]);
    const categories = ref<IBookmarkCategory[]>([]);
    const bookmarks = ref<IBookmarkItem[]>([]);
    const dontAskAgain = ref<boolean>(false);

    const isBookmarkSaved = (url: IBookmarkItem['url']) =>
      bookmarks.value.findIndex(bookmark => bookmark.url === url) >= 0;

    const getNewUUID = () => {
      let uuid = uuidV4();

      if (bookmarks.value.find(item => item.uuid === uuid)) {
        uuid = getNewUUID();
      }

      return uuid;
    };

    const createDefaultGroup = () => {
      const defaultGroup: IBookmarkGroup = {
        uuid: getNewUUID(),
        name: 'Общие',
        order: -1
      };

      groups.value.push(defaultGroup);

      return defaultGroup;
    };

    const getDefaultGroup = () =>
      groups.value.find(bookmark => bookmark.order === -1) ||
      createDefaultGroup();

    const getBookmarkByURL = (url: IBookmarkItem['url']) => {
      const defaultGroup = getDefaultGroup();

      const categoriesUUIDs = categories.value
        .filter(bookmark => bookmark.parentUUID === defaultGroup?.uuid)
        .map(category => category.uuid);

      return bookmarks.value
        .filter(bookmark => categoriesUUIDs.includes(bookmark.parentUUID))
        .find(bookmark => bookmark.url === url);
    };

    const createCategory = (
      category: IBookmarkCategoryInfo
    ): IBookmarkCategory => {
      const parent = getDefaultGroup();

      const newCategory: IBookmarkCategory = {
        uuid: getNewUUID(),
        name: category.name,
        order: category.order,
        parentUUID: parent.uuid
      };

      categories.value.push(newCategory);

      return newCategory;
    };

    const restoreBookmarks = async () => {
      try {
        await store.ready();

        const restored = await store.getItem<TBookmark[]>('default');

        if (!isArray(restored) || !restored?.length) {
          return;
        }

        setBookmarks({
          items: restored,
          groups,
          categories,
          bookmarks
        });
      } catch (err) {
        errorHandler(err);
      }
    };

    const saveBookmarks = async () => {
      try {
        await store.ready();

        return store.setItem<TBookmark[]>('default', [
          ...cloneDeep(groups.value),
          ...cloneDeep(categories.value),
          ...cloneDeep(bookmarks.value)
        ]);
      } catch (err) {
        return Promise.reject(err);
      }
    };

    const addBookmark = async (
      url: IBookmarkItem['url'],
      name: TBookmark['name'],
      code?: IBookmarkCategoryInfo['code']
    ) => {
      try {
        if (!url || !name) {
          return Promise.reject();
        }

        const { data: cat } = await BookmarksApi.getCategory({
          code,
          url
        });

        if (!cat) {
          return Promise.reject();
        }

        const savedCat =
          categories.value.find(category => category.name === cat.name) ||
          createCategory(cat);

        const newBookmark: IBookmarkItem = cloneDeep({
          uuid: getNewUUID(),
          name,
          url,
          order: bookmarks.value.filter(
            bookmark => bookmark.parentUUID === savedCat.uuid
          ).length,
          parentUUID: savedCat.uuid
        });

        bookmarks.value.push(newBookmark);

        await saveBookmarks();

        return newBookmark;
      } catch (err) {
        return Promise.reject(err);
      }
    };

    const removeCategory = (uuid: IBookmarkCategory['uuid']) => {
      if (!uuid) {
        console.error('No UUID present.');

        return Promise.reject();
      }

      try {
        const category = categories.value.find(item => item.uuid === uuid);

        if (!category) {
          return Promise.reject();
        }

        categories.value = categories.value.filter(item => item.uuid !== uuid);

        bookmarks.value = bookmarks.value.filter(
          item => item.parentUUID !== uuid
        );

        return saveBookmarks();
      } catch (err) {
        return Promise.reject(err);
      }
    };

    const removeBookmark = async (uuid: IBookmarkItem['uuid']) => {
      if (!uuid) {
        console.error('No UUID present.');

        return Promise.reject();
      }

      try {
        const bookmark = bookmarks.value.find(item => item.uuid === uuid);

        if (!bookmark) {
          console.error("Can't find bookmark.");

          return Promise.reject();
        }

        bookmarks.value = bookmarks.value.filter(item => item.uuid !== uuid);

        const parent = categories.value.find(
          item => item.uuid === bookmark.parentUUID
        );

        if (!parent) {
          return saveBookmarks();
        }

        const siblings = bookmarks.value.filter(
          item => item.parentUUID === parent.uuid
        );

        if (!siblings.length) {
          await removeCategory(parent.uuid);
        }

        return saveBookmarks();
      } catch (err) {
        return Promise.reject(err);
      }
    };

    const updateBookmark = async (
      url: IBookmarkItem['url'],
      name: IBookmarkItem['name'],
      category: IBookmarkItem['parentUUID'] | undefined = undefined
    ) => {
      const bookmark = bookmarks.value.find(item => item.url === url);

      if (bookmark) {
        await removeBookmark(bookmark.uuid);

        return null;
      }

      return addBookmark(url, name, category);
    };

    const setDontAskAgainPreference = async (checked: boolean) => {
      dontAskAgain.value = checked;

      try {
        await store.ready();

        store.setItem('dontAskAgain', dontAskAgain.value);
      } catch (err) {
        errorHandler(err);
      }
    };

    const getDontAskAgainPreference = async () => {
      try {
        await store.ready();

        dontAskAgain.value =
          (await store.getItem<boolean>('dontAskAgain')) || false;
      } catch (err) {
        errorHandler(err);
      }
    };

    const removeBookmarkWithConfirmationModal = (bookmark: IBookmarkItem) => {
      if (dontAskAgain.value) {
        removeBookmark(bookmark.uuid);
      } else {
        patchOptions({
          attrs: {
            modelValue: true,
            bookmarkName: bookmark.name,
            onConfirm: (checked: boolean) => {
              setDontAskAgainPreference(checked);
              removeBookmark(bookmark.uuid);
              close();
            },
            onClose: () => {
              dontAskAgain.value = false;
              close();
            }
          }
        });
        open();
      }
    };

    return {
      groups,
      categories,
      bookmarks,
      dontAskAgain,
      isBookmarkSaved,
      getGroupBookmarks: computed(() =>
        getGroupBookmarks({
          groups,
          categories,
          bookmarks
        })
      ),

      getBookmarkByURL,
      createDefaultGroup,
      getDefaultGroup,
      createCategory,
      restoreBookmarks,
      saveBookmarks,
      addBookmark,
      removeBookmark,
      updateBookmark,
      setDontAskAgainPreference,
      getDontAskAgainPreference,
      removeBookmarkWithConfirmationModal
    };
  }
);
