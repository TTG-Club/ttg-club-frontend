import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import { computed, ref } from 'vue';
import type {
    TBookmark, IBookmarkCategoryApi, IBookmarkCategoryInfo, IBookmarkGroup, IBookmarkGroupApi, IBookmarkItemApi
} from '@/features/bookmarks/types/Bookmark.types';
import { useAxios } from '@/common/composition/useAxios';
import type { Maybe } from '@/types/Shared/Utility.types';
import BookmarksApi from '@/features/bookmarks/api';
import {
    isBookmarkCategoryApi, isBookmarkGroupApi, isBookmarkItemApi
} from '@/features/bookmarks/utils';

const SESSION_OPENED_GROUPS_KEY = 'dnd5club_opened_bookmark_groups';

const signals: {
    add: Maybe<AbortController>;
    delete: Maybe<AbortController>;
} = {
    add: undefined,
    delete: undefined
};

export type TQueryAddBookmark = Omit<Partial<TBookmark>, 'name'> & Pick<TBookmark, 'name'>

export const useCustomBookmarkStore = defineStore('CustomBookmarkStore', () => {
    const http = useAxios();

    const bookmarks = ref<Array<TBookmark>>([]);
    const openedGroups = ref<TBookmark['uuid'][]>([]);

    const isGroupOpened = (uuid: TBookmark['uuid']) => openedGroups.value.includes(uuid);
    const isBookmarkSaved = (url: IBookmarkItemApi['url']) => bookmarks.value.findIndex(bookmark => bookmark.url === url) > -1;

    const isBookmarkSavedInDefault = (url: IBookmarkItemApi['url']) => {
        const defaultGroup = bookmarks.value.find(item => isBookmarkGroupApi(item) && item.order === -1);

        if (!defaultGroup) {
            return undefined;
        }

        const categoriesUUIDs = bookmarks.value
            .filter(item => isBookmarkCategoryApi(item) && item.parentUUID === defaultGroup.uuid)
            .map(item => item.uuid);

        return bookmarks.value
            .findIndex(item => isBookmarkItemApi(item) && categoriesUUIDs.includes(item.parentUUID) && item.url === url) > -1;
    };

    const isBookmarkSavedInGroup = (url: TBookmark['url'], groupUUID: TBookmark['uuid']) => {
        const categoriesUUIDs = bookmarks.value
            .filter(item => item.parentUUID === groupUUID)
            .map(item => item.uuid);

        return bookmarks.value
            .findIndex(item => (item.parentUUID && categoriesUUIDs.includes(item.parentUUID)) && item.url === url) > -1;
    };

    const getGroupBookmarks = computed<IBookmarkGroup>(() => {
        const groups: IBookmarkGroup = bookmarks.value.filter(group => !group.parentUUID);

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

    const getGroups = computed(() => sortBy(bookmarks.value.filter(bookmark => !bookmark.parentUUID), [o => o.order]));

    const getBookmarkParentUUIDs = (url: TBookmark['url']) => {
        if (!isBookmarkSaved(url)) {
            return undefined;
        }

        const index = bookmarks.value.findIndex(bookmark => bookmark.url === url);

        const categoryIndex = bookmarks.value
            .findIndex(category => category.uuid === bookmarks.value[index].parentUUID);

        if (categoryIndex < 0) {
            return undefined;
        }

        return cloneDeep(bookmarks.value.find(group => group.uuid === bookmarks.value[categoryIndex].parentUUID));
    };

    const queryGetBookmarks = async () => {
        try {
            const resp = await http.get<Array<TBookmark>>({
                url: '/bookmarks'
            });

            if (resp.status !== 200) {
                return Promise.reject(resp.statusText);
            }

            bookmarks.value = resp.data;

            return Promise.resolve(resp.data);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    const queryAddBookmark = async (bookmark: TQueryAddBookmark): Promise<TBookmark> => {
        try {
            if (!bookmark?.name) {
                return Promise.reject(new Error('Name is undefined'));
            }

            if (signals.add) {
                signals.add.abort();
            }

            signals.add = new AbortController();

            const resp = await http.post<TBookmark>({
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
            const defaultGroup = await queryAddBookmark({
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

            let group = bookmarks.value.find(bookmark => bookmark.order === -1);

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
            const newCategory = await queryAddBookmark({
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
        url?: TBookmark['url'];
        category?: TBookmark['uuid'];
        groupUUID: TBookmark['uuid'];
    }) => {
        try {
            const cat = await BookmarksApi.getCategory({
                code: category,
                url
            });

            if (!cat) {
                return Promise.reject();
            }

            const categories = bookmarks.value.filter(item => item.parentUUID === groupUUID);

            let savedCat = categories.find(bookmark => bookmark.name === cat.name);

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
        url: TBookmark['url'];
        name: TBookmark['name'];
        category: TBookmark['uuid'];
        groupUUID: TBookmark['uuid']
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

            return queryAddBookmark({
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
        url: TBookmark['url'];
        groupUUID: TBookmark['uuid']
    }) => {
        try {
            await queryGetBookmarks();
        } catch (err) {
            return Promise.reject(err);
        }

        const categoriesUUIDs = bookmarks.value
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
        url: TBookmark['url'];
        name: TBookmark['name'];
        category: TBookmark['uuid'];
        groupUUID: TBookmark['uuid']
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
        bookmarks,
        openedGroups,

        isGroupOpened,
        isBookmarkSaved,
        isBookmarkSavedInDefault,
        isBookmarkSavedInGroup,

        getGroupBookmarks,
        getGroups,
        getBookmarkParentUUIDs,

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
