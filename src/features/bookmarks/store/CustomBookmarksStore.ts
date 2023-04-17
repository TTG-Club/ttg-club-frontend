import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import cloneDeep from 'lodash/cloneDeep';
import { computed, ref } from 'vue';
import type { IBookmark } from '@/features/bookmarks/types/Bookmark.types';
import { useAxios } from '@/common/composition/useAxios';
import type { Maybe } from '@/types/Shared/Utility.types';
import BookmarksApi from '@/features/bookmarks/api';

const SESSION_OPENED_GROUPS_KEY = 'dnd5club_opened_bookmark_groups';

const signals: {
    add: Maybe<AbortController>;
    delete: Maybe<AbortController>;
} = {
    add: undefined,
    delete: undefined
};

export type TQueryAddBookmark = Omit<Partial<IBookmark>, 'name'> & Pick<IBookmark, 'name'>

export const useCustomBookmarkStore = defineStore('CustomBookmarkStore', () => {
    const http = useAxios();

    const bookmarks = ref<Array<IBookmark>>([]);
    const openedGroups = ref<IBookmark['uuid'][]>([]);

    const isGroupOpened = (uuid: IBookmark['uuid']) => openedGroups.value.includes(uuid);
    const isBookmarkSaved = (url: IBookmark['url']) => bookmarks.value.findIndex(bookmark => bookmark.url === url) > -1;

    const isBookmarkSavedInDefault = (url: IBookmark['url']) => {
        const defaultGroup = bookmarks.value.find(item => !item.parentUUID && item.order === -1);

        if (!defaultGroup) {
            return undefined;
        }

        const categoriesUUIDs = bookmarks.value
            .filter(item => item.parentUUID === defaultGroup.uuid)
            .map(item => item.uuid);

        return bookmarks.value
            .findIndex(item => (item.parentUUID && categoriesUUIDs.includes(item.parentUUID)) && item.url === url) > -1;
    };

    const isBookmarkSavedInGroup = (url: IBookmark['url'], groupUUID: IBookmark['uuid']) => {
        const categoriesUUIDs = bookmarks.value
            .filter(item => item.parentUUID === groupUUID)
            .map(item => item.uuid);

        return bookmarks.value
            .findIndex(item => (item.parentUUID && categoriesUUIDs.includes(item.parentUUID)) && item.url === url) > -1;
    };

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

    const getGroups = computed(() => sortBy(bookmarks.value.filter(bookmark => !bookmark.parentUUID), [o => o.order]));

    const getBookmarkParentUUIDs = (url: IBookmark['url']) => {
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
            const resp = await http.get<Array<IBookmark>>({
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

    const queryAddBookmark = async (bookmark: TQueryAddBookmark): Promise<IBookmark> => {
        try {
            if (!bookmark?.name) {
                return Promise.reject(new Error('Name is undefined'));
            }

            if (signals.add) {
                signals.add.abort();
            }

            signals.add = new AbortController();

            const resp = await http.post<IBookmark>({
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

    const queryUpdateBookmark = async (bookmark: IBookmark) => {
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

    const queryDeleteBookmark = async (uuid: IBookmark['uuid']) => {
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

    const createCategory = async (category: IBookmark, groupUUID: IBookmark['uuid']) => {
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
        url: IBookmark['url'];
        category: IBookmark['uuid'];
        groupUUID: IBookmark['uuid']
    }) => {
        try {
            let cat = await BookmarksApi.getCategoryByCode(category);

            if (!cat) {
                cat = await BookmarksApi.getCategoryByURL(url!);
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
        url: IBookmark['url'];
        name: IBookmark['name'];
        category: IBookmark['uuid'];
        groupUUID: IBookmark['uuid']
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
        url: IBookmark['url'];
        groupUUID: IBookmark['uuid']
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
        url: IBookmark['url'];
        name: IBookmark['name'];
        category: IBookmark['uuid'];
        groupUUID: IBookmark['uuid']
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

    const toggleGroup = (uuid: IBookmark['uuid']) => {
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
