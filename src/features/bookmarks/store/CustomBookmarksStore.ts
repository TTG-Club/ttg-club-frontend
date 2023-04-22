import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import { computed, ref } from 'vue';
import type {
    IBookmarkCategory,
    IBookmarkCategoryInfo,
    IBookmarkGroup,
    IBookmarkItem,
    TBookmark, TWithChildren
} from '@/features/bookmarks/types/Bookmark.types';
import { useAxios } from '@/common/composition/useAxios';
import type { Maybe } from '@/types/Shared/Utility.types';
import BookmarksApi from '@/features/bookmarks/api';
import {
    isBookmarkCategory, isBookmarkGroup, isBookmarkItem
} from '@/features/bookmarks/utils';

const SESSION_OPENED_GROUPS_KEY = 'dnd5club_opened_bookmark_groups';

const signals: {
    add: Maybe<AbortController>;
    delete: Maybe<AbortController>;
} = {
    add: undefined,
    delete: undefined
};

export type TQueryAddBookmark = Pick<TBookmark, 'name'> & Partial<TBookmark>

export const useCustomBookmarkStore = defineStore('CustomBookmarkStore', () => {
    const http = useAxios();

    const groups = ref<IBookmarkGroup[]>([]);
    const categories = ref<IBookmarkCategory[]>([]);
    const bookmarks = ref<IBookmarkItem[]>([]);

    const openedGroups = ref<IBookmarkGroup['uuid'][]>([]);

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

    const getGroupBookmarks = computed(() => sortBy(
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
    ));

    const getGroups = computed(() => sortBy(groups.value, [o => o.order]));

    // const getBookmarkParentUUIDs = (url: IBookmarkItem['url']) => {
    //     if (!isBookmarkSaved(url)) {
    //         return undefined;
    //     }
    //
    //     const index = bookmarks.value.findIndex(bookmark => bookmark.url === url);
    //
    //     const categoryIndex = bookmarks.value
    //         .findIndex(category => category.uuid === bookmarks.value[index].parentUUID);
    //
    //     if (categoryIndex < 0) {
    //         return undefined;
    //     }
    //
    //     return cloneDeep(bookmarks.value.find(group => group.uuid === bookmarks.value[categoryIndex].parentUUID));
    // };

    const setBookmarks = (items: TBookmark[]) => {
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

        groups.value = cloneDeep(newGroups);
        categories.value = cloneDeep(newCategories);
        bookmarks.value = cloneDeep(newBookmarks);
    };

    const queryGetBookmarks = async () => {
        try {
            const resp = await http.get<Array<TBookmark>>({
                url: '/bookmarks'
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            setBookmarks(resp.data);

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const queryAddBookmark = async <T>(bookmark: TQueryAddBookmark): Promise<T> => {
        try {
            if (!bookmark?.name) {
                return Promise.reject(new Error('Name is undefined'));
            }

            if (signals.add) {
                signals.add.abort();
            }

            signals.add = new AbortController();

            const resp = await http.post<T>({
                url: '/bookmarks',
                payload: cloneDeep(bookmark),
                signal: signals.add.signal
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            await queryGetBookmarks();

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        } finally {
            signals.add = undefined;
        }
    };

    const queryUpdateBookmark = async (bookmark: TBookmark) => {
        try {
            if (!bookmark?.name) {
                return Promise.reject(new Error('Name is undefined'));
            }

            if (signals.add) {
                signals.add.abort();
            }

            signals.add = new AbortController();

            const resp = await http.put({
                url: '/bookmarks',
                payload: cloneDeep(bookmark),
                signal: signals.add.signal
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            await queryGetBookmarks();

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        } finally {
            signals.add = undefined;
        }
    };

    const queryDeleteBookmark = async (uuid: TBookmark['uuid']) => {
        try {
            if (!uuid) {
                return Promise.reject(new Error('UUID is undefined'));
            }

            if (signals.delete) {
                signals.delete.abort();
            }

            signals.delete = new AbortController();

            const resp = await http.delete({
                url: `/bookmarks/${ uuid }`,
                signal: signals.delete.signal
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            await queryGetBookmarks();

            if (openedGroups.value.includes(uuid)) {
                openedGroups.value = openedGroups.value.filter(item => item !== uuid);
            }

            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        } finally {
            signals.delete = undefined;
        }
    };

    const createDefaultGroup = async () => {
        try {
            const defaultGroup = await queryAddBookmark<IBookmarkGroup>({
                name: 'Общие',
                order: -1
            });

            return Promise.resolve(defaultGroup);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const getDefaultGroup = async () => {
        try {
            await queryGetBookmarks();

            let group = groups.value.find(bookmark => bookmark.order === -1);

            if (!group) {
                group = await createDefaultGroup();
            }

            return Promise.resolve(group);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const createCategory = async (category: IBookmarkCategoryInfo, groupUUID: TBookmark['uuid']) => {
        try {
            const newCategory = await queryAddBookmark<IBookmarkCategory>({
                name: category.name,
                parentUUID: groupUUID
            });

            return Promise.resolve(newCategory);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const getCategoryInGroup = async ({
        url,
        category,
        groupUUID
    }: {
        url?: IBookmarkItem['url'];
        category?: IBookmarkCategory['uuid'];
        groupUUID: IBookmarkGroup['uuid'];
    }) => {
        try {
            const cat = await BookmarksApi.getCategory({
                code: category,
                url
            });

            if (!cat) {
                return Promise.reject();
            }

            let savedCat = categories.value.find(bookmark => bookmark.name === cat.name);

            if (!savedCat) {
                savedCat = await createCategory(cat, groupUUID);
            }

            return Promise.resolve(savedCat);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const addBookmarkInGroup = async ({
        url,
        name,
        category,
        groupUUID
    }: {
        url: IBookmarkItem['url'];
        name: TBookmark['name'];
        category?: IBookmarkCategory['uuid'];
        groupUUID: IBookmarkGroup['uuid']
    }) => {
        try {
            if (!url || !name) {
                return Promise.reject();
            }

            const savedCat = await getCategoryInGroup({
                url,
                category,
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
        category,
        groupUUID
    }: {
        url: IBookmarkItem['url'];
        name: TBookmark['name'];
        category?: IBookmarkCategory['uuid'];
        groupUUID: IBookmarkGroup['uuid']
    }) => {
        const bookmark = await getSavedBookmarkInGroup({
            url,
            groupUUID
        });

        if (bookmark) {
            try {
                await queryDeleteBookmark(bookmark.uuid);

                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        }

        try {
            return addBookmarkInGroup({
                url,
                name,
                category,
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

    const toggleGroup = (uuid: TBookmark['uuid']) => {
        const isOpened = openedGroups.value.includes(uuid);

        const updateSessionStorage = () => {
            if (openedGroups.value.length) {
                sessionStorage.setItem(SESSION_OPENED_GROUPS_KEY, JSON.stringify(openedGroups.value));

                return;
            }

            sessionStorage.removeItem(SESSION_OPENED_GROUPS_KEY);
        };

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

    return {
        groups,
        categories,
        bookmarks,
        openedGroups,

        isGroupOpened,
        isBookmarkSaved,
        isBookmarkSavedInDefault,
        isBookmarkSavedInGroup,

        getGroupBookmarks,
        getGroups,

        // getBookmarkParentUUIDs,

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
        toggleGroup
    };
});
