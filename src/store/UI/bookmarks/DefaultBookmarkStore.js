import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import localforage from 'localforage';
import isArray from 'lodash/isArray';
import { v4 as uuidV4 } from 'uuid';
import sortBy from 'lodash/sortBy';
import errorHandler from '@/common/helpers/errorHandler';
import { DB_NAME } from '@/common/const/UI';

export const useDefaultBookmarkStore = defineStore('DefaultBookmarkStore', {
    state: () => ({
        bookmarks: [],
        store: localforage.createInstance({
            name: DB_NAME,
            storeName: 'bookmarks'
        })
    }),

    getters: {
        getBookmarks: state => state.bookmarks,
        getGroupBookmarks: state => {
            const groups = state.bookmarks.filter(group => !group.parentUUID);

            return sortBy(
                groups.map(group => ({
                    ...group,
                    children: sortBy(
                        state.bookmarks
                            .filter(category => category.parentUUID && category.parentUUID === group.uuid)
                            .map(category => ({
                                ...category,
                                children: sortBy(
                                    state.bookmarks.filter(bookmark => (
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
        },
        isBookmarkSaved: state => url => state.bookmarks.findIndex(bookmark => bookmark.url === url) >= 0,
        getBookmarkByURL: state => url => {
            const defaultGroup = state.bookmarks.find(bookmark => bookmark.order === -1);

            const categoriesUUIDs = state.bookmarks
                .filter(bookmark => bookmark.parentUUID === defaultGroup?.uuid)
                .map(category => category.uuid);

            return state.bookmarks
                .filter(bookmark => categoriesUUIDs.includes(bookmark.parentUUID))
                .find(bookmark => bookmark.url === url);
        }
    },

    actions: {
        async restoreBookmarks() {
            try {
                await this.store.ready();

                const oldFormat = await this.store.getItem('saved');

                const restored = isArray(oldFormat) && oldFormat.length
                    ? await this.getConvertedBookmarks(oldFormat)
                    : await this.store.getItem('default');

                this.bookmarks = cloneDeep(!isArray(restored) || !restored.length ? [] : restored);
            } catch (err) {
                errorHandler(err);
            }
        },

        async saveBookmarks(payload) {
            try {
                await this.store.ready();

                await this.store.setItem('default', cloneDeep(payload || this.bookmarks));
            } catch (err) {
                errorHandler(err);
            }
        },

        async addBookmark(url, name, category) {
            try {
                if (!url || !name) {
                    return Promise.reject();
                }

                let cat;

                if (typeof category === 'string') {
                    cat = await this.getCategoryByCode(category);
                }

                if (!cat) {
                    cat = await this.getCategoryByURL(url);
                }

                let savedCat = this.bookmarks.find(bookmark => bookmark.name === cat.name);

                if (!savedCat) {
                    savedCat = this.createCategory(cat);
                }

                this.bookmarks.push(cloneDeep({
                    uuid: this.getNewUUID(),
                    name,
                    url,
                    order: this.bookmarks.filter(bookmark => bookmark.parentUUID === savedCat.uuid).length,
                    parentUUID: savedCat.uuid
                }));

                await this.saveBookmarks();

                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            }
        },

        async removeBookmark(url) {
            if (!url || !this.isBookmarkSaved(url)) {
                return;
            }

            const deleteUUIDs = [];

            const addEmptyParents = bookmark => {
                const parent = this.bookmarks.find(item => item.uuid === bookmark?.parentUUID);

                if (!parent) {
                    return;
                }

                const siblings = this.bookmarks.filter(item => item.parentUUID === parent.uuid);

                if (siblings?.length !== 1) {
                    return;
                }

                deleteUUIDs.push(parent.uuid);

                if (parent.parentUUID) {
                    addEmptyParents(parent);
                }
            };

            const bookmark = this.getBookmarkByURL(url);

            deleteUUIDs.push(bookmark.uuid);

            if (bookmark.parentUUID) {
                addEmptyParents(bookmark);
            }

            this.bookmarks = this.bookmarks.filter(item => !deleteUUIDs.includes(item.uuid));

            await this.saveBookmarks();
        },

        async updateBookmark(url, name, category = undefined) {
            if (this.isBookmarkSaved(url)) {
                await this.removeBookmark(url);

                return;
            }

            await this.addBookmark(url, name, category);
        },

        async getConvertedBookmarks(oldFormat) {
            try {
                const categories = await this.getCategories();

                const parent = cloneDeep({
                    uuid: this.getNewUUID(),
                    order: -1,
                    name: 'Общие'
                });

                const list = [parent];

                for (let i = 0; i < oldFormat.length; i++) {
                    const category = oldFormat[i];
                    const newCategory = categories.find(item => item.name === category.label);

                    const updatedCat = cloneDeep({
                        uuid: this.getNewUUID(),
                        order: newCategory.order,
                        name: newCategory.name,
                        parentUUID: parent.uuid
                    });

                    list.push(updatedCat);

                    for (let j = 0; j < category.links.length; j++) {
                        const bookmark = category.links[j];

                        list.push({
                            uuid: this.getNewUUID(),
                            order: j,
                            name: bookmark.label,
                            url: bookmark.url,
                            parentUUID: updatedCat.uuid
                        });
                    }
                }

                await this.store.removeItem('saved');

                return list;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        getNewUUID() {
            let uuid = uuidV4();

            if (this.bookmarks.find(item => item.uuid === uuid)) {
                uuid = this.getNewUUID();
            }

            return uuid;
        },

        createDefaultGroup() {
            const defaultGroup = cloneDeep({
                uuid: this.getNewUUID(),
                name: 'Общие',
                order: -1
            });

            this.bookmarks.push(defaultGroup);

            return defaultGroup;
        },

        getDefaultGroup() {
            let group = this.bookmarks.find(bookmark => bookmark.order === -1);

            if (!group) {
                group = this.createDefaultGroup();
            }

            return group;
        },

        async getCategories() {
            try {
                const resp = await this.$http.get('/bookmarks/categories');

                if (resp.status !== 200) {
                    return Promise.reject(resp.statusText);
                }

                return Promise.resolve(resp.data);
            } catch (err) {
                return Promise.reject(err);
            }
        },

        createCategory(category) {
            const parent = this.getDefaultGroup();

            const newCategory = cloneDeep({
                uuid: this.getNewUUID(),
                name: category.name,
                order: category.order,
                parentUUID: parent.uuid
            });

            this.bookmarks.push(newCategory);

            return newCategory;
        },

        async getCategoryByURL(url) {
            try {
                const resp = await this.$http.get('/bookmarks/category', {
                    url: encodeURIComponent(url)
                });

                if (resp.status !== 200) {
                    return Promise.reject(resp.statusText);
                }

                return Promise.resolve(resp.data);
            } catch (err) {
                return Promise.reject(err);
            }
        },

        async getCategoryByCode(code) {
            try {
                const resp = await this.$http.get('/bookmarks/category', { code });

                if (resp.status !== 200) {
                    return Promise.reject(resp.statusText);
                }

                return Promise.resolve(resp.data);
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }
});
