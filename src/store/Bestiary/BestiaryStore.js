import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'bestiary';

export const useBestiaryStore = defineStore('BestiaryStore', {
    state: () => ({
        bestiary: [],
        filter: undefined,
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/bestiary'
        },
        customFilter: undefined,
        controllers: {
            bestiaryQuery: undefined,
            creatureInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getBestiary: state => state.bestiary
    },

    actions: {
        async initFilter(storeKey, customFilter) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/bestiary'
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
        async bestiaryQuery(options = {}) {
            try {
                if (this.controllers.bestiaryQuery) {
                    this.controllers.bestiaryQuery.abort();
                }

                this.controllers.bestiaryQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter?.getSearchState || ''
                    },
                    order: [
                        {
                            field: 'exp',
                            direction: 'asc'
                        },
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

                const resp = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.bestiaryQuery.signal
                );

                this.controllers.bestiaryQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initBestiary(url) {
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

            const bestiary = await this.bestiaryQuery(config);

            this.bestiary = bestiary;
            this.config.end = bestiary.length < config.limit;
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

            const bestiary = await this.bestiaryQuery(config);

            this.config.page = config.page;
            this.config.end = bestiary.length < config.limit;

            this.bestiary.push(...bestiary);
        },

        async creatureInfoQuery(url) {
            try {
                if (this.controllers.creatureInfoQuery) {
                    this.controllers.creatureInfoQuery.abort();
                }

                this.controllers.creatureInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.creatureInfoQuery.signal);

                this.controllers.creatureInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearBestiary() {
            this.bestiary = [];
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
                url: '/bestiary'
            };
        },

        clearStore() {
            this.clearBestiary();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
