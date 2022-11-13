import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import isArray from 'lodash/isArray';
import errorHandler from '@/common/helpers/errorHandler';
import FilterService from '@/common/services/FilterService';

const DB_NAME = 'classes';

export const useClassesStore = defineStore('ClassesStore', {
    state: () => ({
        classes: [],
        filter: undefined,
        config: {
            page: 0,
            url: '/classes'
        },
        controllers: {
            classesQuery: undefined,
            classInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getClasses: state => state.classes
    },

    actions: {
        async initFilter(storeKey, url) {
            try {
                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/classes'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                if (url) {
                    filterOptions.url = url;
                }

                await this.filter.init(filterOptions);
            } catch (err) {
                errorHandler(err);
            }
        },

        /**
         * @param {{}} options
         * @param {number} options.page
         * @param {number} options.limit
         * @param {object} options.filter
         * @param {boolean} options.search.exact
         * @param {string} options.search.value
         * @param {{field: string, direction: 'asc' | 'desc'}[]} options.order
         * @returns {Promise<*[]>}
         */
        async classesQuery(options = {}) {
            try {
                if (this.controllers.classesQuery) {
                    this.controllers.classesQuery.abort();
                }

                this.controllers.classesQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter?.getSearchState || ''
                    },
                    order: [
                        {
                            field: 'name',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                const { data } = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.classesQuery.signal
                );

                this.controllers.classesQuery = undefined;

                const getArchetypes = list => sortBy(
                    Object.values(groupBy(list, o => o.type.name))
                        .map(value => ({
                            name: value[0].type,
                            list: value
                        })),
                    [o => o.name.order]
                );

                return data.map(value => {
                    const res = value;

                    if (isArray(value.archetypes)) {
                        res.archetypes = getArchetypes(value.archetypes);
                    }

                    return res;
                });
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initClasses(url) {
            this.clearConfig();

            if (url) {
                this.config.url = url;
            }

            const config = {
                page: this.config.page,
                limit: this.config.limit
            };

            if (this.filter && this.filter.isCustomized) {
                config.filter = this.filter.getQueryParams;
            }

            this.classes = await this.classesQuery(config);
        },

        async classInfoQuery(url) {
            try {
                if (this.controllers.classInfoQuery) {
                    this.controllers.classInfoQuery.abort();
                }

                this.controllers.classInfoQuery = new AbortController();

                const { data } = await this.$http.post(
                    url,
                    { filter: this.filter.getQueryParams },
                    this.controllers.classInfoQuery.signal
                );

                this.controllers.classInfoQuery = undefined;

                let images = [];

                if (isArray(data.images) && data.images.length) {
                    images = [...data.images];
                }

                if ((!isArray(data.images) || !data.images?.length) && data.image) {
                    images.push(data.image);
                }

                return {
                    ...data,
                    images,
                    tabs: sortBy(data.tabs, ['order'])
                };
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearClasses() {
            this.classes = [];
        },

        clearFilter() {
            this.filter = undefined;
        },

        clearConfig() {
            this.config = {
                page: 0,
                url: '/classes'
            };
        },

        clearStore() {
            this.clearClasses();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
