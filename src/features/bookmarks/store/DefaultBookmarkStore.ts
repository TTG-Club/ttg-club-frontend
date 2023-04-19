import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import localforage from 'localforage';
import isArray from 'lodash/isArray';
import { v4 as uuidV4 } from 'uuid';
import sortBy from 'lodash/sortBy';
import { computed, ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import { DB_NAME } from '@/common/const/UI';
import type { TBookmark, IBookmarkCategoryInfo } from '@/features/bookmarks/types/Bookmark.types';
import BookmarksApi from '@/features/bookmarks/api';

export const useDefaultBookmarkStore = defineStore('DefaultBookmarkStore', () => {
    const bookmarks = ref<Array<TBookmark>>([]);

    const store = localforage.createInstance({
        name: DB_NAME,
        storeName: 'bookmarks'
    });

    const isBookmarkSaved = (url: TBookmark['url']) => bookmarks.value.findIndex(bookmark => bookmark.url === url) >= 0;

    const getGroupBookmarks = computed(() => {
        const groups = bookmarks.value.filter(group => !group.parentUUID);

        return sortBy(
            groups.map(group => ({
                ...group,
                children: sortBy(
                    bookmarks.value
                        .filter(category => category.parentUUID && category.parentUUID === group.uuid)
                        .map(category => ({
                            ...category,
                            children: sortBy(
                                bookmarks.value.filter(bookmark => (
                                    bookmark.parentUUID
                                        && bookmark.parentUUID === category.uuid
                                )),
                                [o => o.order]
                            )
                        })),
                    [o => o.order]
                )
            })),
            [o => o.order]
        );
    });

    const getBookmarkByURL = (url: TBookmark['url']) => {
        const defaultGroup = bookmarks.value.find(bookmark => bookmark.order === -1);

        const categoriesUUIDs = bookmarks.value
            .filter(bookmark => bookmark.parentUUID === defaultGroup?.uuid)
            .map(category => category.uuid);

        return bookmarks.value
            .filter(bookmark => bookmark.parentUUID && categoriesUUIDs.includes(bookmark.parentUUID))
            .find(bookmark => bookmark.url === url);
    };

    const getNewUUID = () => {
        let uuid = uuidV4();

        if (bookmarks.value.find(item => item.uuid === uuid)) {
            uuid = getNewUUID();
        }

        return uuid;
    };

    const createDefaultGroup = () => {
        const defaultGroup = cloneDeep({
            uuid: getNewUUID(),
            name: 'Общие',
            order: -1
        });

        bookmarks.value.push(defaultGroup);

        return defaultGroup;
    };

    const getDefaultGroup = () => {
        let group = bookmarks.value.find(bookmark => bookmark.order === -1);

        if (!group) {
            group = createDefaultGroup();
        }

        return group;
    };

    const createCategory = (category: IBookmarkCategoryInfo): TBookmark => {
        const parent = getDefaultGroup();

        const newCategory = {
            uuid: getNewUUID(),
            name: category.name,
            order: category.order,
            parentUUID: parent.uuid
        };

        bookmarks.value.push(newCategory);

        return newCategory;
    };

    const getConvertedBookmarks = async (oldFormat: any[]) => {
        try {
            const categories = await BookmarksApi.getCategories();

            const parent = {
                uuid: getNewUUID(),
                order: -1,
                name: 'Общие'
            };

            const list: TBookmark[] = [parent];

            for (let i = 0; i < oldFormat.length; i++) {
                const category = oldFormat[i];
                const newCategory = categories.find(item => item.name === category.label);

                if (!newCategory) {
                    continue;
                }

                const updatedCat = {
                    uuid: getNewUUID(),
                    order: newCategory.order,
                    name: newCategory.name,
                    parentUUID: parent.uuid
                };

                list.push(updatedCat);

                for (let j = 0; j < category.links.length; j++) {
                    const bookmark = category.links[j];

                    list.push({
                        uuid: getNewUUID(),
                        order: j,
                        name: bookmark.label,
                        url: bookmark.url,
                        parentUUID: updatedCat.uuid
                    });
                }
            }

            await store.removeItem('saved');

            return list;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const restoreBookmarks = async () => {
        try {
            await store.ready();

            const oldFormat = await store.getItem('saved');

            const restored = isArray(oldFormat) && oldFormat.length
                ? await getConvertedBookmarks(oldFormat)
                : await store.getItem('default');

            bookmarks.value = cloneDeep(!isArray(restored) || !restored.length ? [] : restored);
        } catch (err) {
            errorHandler(err);
        }
    };

    const saveBookmarks = async (payload?: TBookmark[]) => {
        try {
            await store.ready();

            await store.setItem('default', payload || bookmarks.value);
        } catch (err) {
            errorHandler(err);
        }
    };

    const addBookmark = async (url: TBookmark['url'], name: TBookmark['name'], code?: IBookmarkCategoryInfo['code']) => {
        try {
            if (!url || !name) {
                return Promise.reject();
            }

            const cat = await BookmarksApi.getCategory({
                code,
                url
            });

            if (!cat) {
                return Promise.reject();
            }

            const savedCat = bookmarks.value.find(bookmark => bookmark.name === cat.name) || createCategory(cat);

            const newBookmark = cloneDeep({
                uuid: getNewUUID(),
                name,
                url,
                order: bookmarks.value.filter(bookmark => bookmark.parentUUID === savedCat.uuid).length,
                parentUUID: savedCat.uuid
            });

            bookmarks.value.push(newBookmark);

            await saveBookmarks();

            return newBookmark;
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const removeBookmark = (url: TBookmark['url']) => {
        if (!url || !isBookmarkSaved(url)) {
            return Promise.reject();
        }

        try {
            const deleteUUIDs: Array<TBookmark['uuid']> = [];

            const addEmptyParents = (bookmark: TBookmark) => {
                const parent = bookmarks.value.find(item => item.uuid === bookmark?.parentUUID);

                if (!parent) {
                    return;
                }

                const siblings = bookmarks.value.filter(item => item.parentUUID === parent.uuid);

                if (siblings?.length !== 1) {
                    return;
                }

                deleteUUIDs.push(parent.uuid);

                if (parent.parentUUID) {
                    addEmptyParents(parent);
                }
            };

            const bookmark = getBookmarkByURL(url);

            if (!bookmark) {
                return Promise.reject();
            }

            deleteUUIDs.push(bookmark.uuid);

            if (bookmark.parentUUID) {
                addEmptyParents(bookmark);
            }

            bookmarks.value = bookmarks.value.filter(item => !deleteUUIDs.includes(item.uuid));

            return saveBookmarks();
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const updateBookmark = async (url: string, name: string, category = undefined) => {
        if (isBookmarkSaved(url)) {
            await removeBookmark(url);

            return null;
        }

        return addBookmark(url, name, category);
    };

    return {
        bookmarks,

        isBookmarkSaved,

        getGroupBookmarks,
        getBookmarkByURL,
        createDefaultGroup,
        getDefaultGroup,
        createCategory,
        restoreBookmarks,
        saveBookmarks,
        addBookmark,
        removeBookmark,
        updateBookmark
    };
});
