import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'gods';

export const useGodsStore = defineStore('GodsStore', {
    state: () => ({
        gods: [],
        filter: undefined,
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/gods'
        },
        customFilter: undefined,
        controllers: {
            godsQuery: undefined,
            godInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getGods: state => state.gods
    },

    actions: {
        async initFilter(storeKey, customFilter) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/gods'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                if (customFilter) {
                    filterOptions.customFilter = customFilter;
                    this.customFilter = cloneDeep(customFilter);
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
        async godsQuery(options = {}) {
            try {
                if (this.controllers.godsQuery) {
                    this.controllers.godsQuery.abort();
                }

                this.controllers.godsQuery = new AbortController();

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

                if (this.customFilter) {
                    apiOptions.customFilter = this.customFilter;
                }

                const { data } = await this.$http.post(this.config.url, apiOptions, this.controllers.godsQuery.signal);

                this.controllers.godsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initGods(url) {
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

            const gods = await this.godsQuery(config);

            this.gods = gods;
            this.config.end = gods.length < config.limit;
        },

        async nextPage() {
            if (this.config.end) {
                return;
            }

            const config = {
                page: this.config.page + 1,
                limit: this.config.limit
            };

            if (this.filter && this.filter.isCustomized) {
                config.filter = this.filter.getQueryParams;
            }

            const gods = await this.godsQuery(config);

            this.config.page = config.page;
            this.config.end = gods.length < config.limit;

            this.gods.push(...gods);
        },

        async godInfoQuery(url) {
            try {
                if (this.controllers.godInfoQuery) {
                    this.controllers.godInfoQuery.abort();
                }

                this.controllers.godInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.godInfoQuery.signal);

                this.controllers.godInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearGods() {
            this.gods = [];
        },

        clearFilter() {
            this.filter = undefined;
        },

        clearCustomFilter() {
            this.customFilter = undefined;
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/gods'
            };
        },

        clearStore() {
            this.clearGods();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
