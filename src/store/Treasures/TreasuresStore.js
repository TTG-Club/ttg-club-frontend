import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'treasures';

export const useTreasuresStore = defineStore('TreasuresStore', {
    state: () => ({
        treasures: [],
        filter: undefined,
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/treasures'
        },
        customFilter: undefined,
        controllers: {
            treasuresQuery: undefined,
            treasureInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getTreasures: state => state.treasures
    },

    actions: {
        async initFilter(storeKey, customFilter) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/treasures'
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
        async treasuresQuery(options = {}) {
            try {
                if (this.controllers.treasuresQuery) {
                    this.controllers.treasuresQuery.abort();
                }

                this.controllers.treasuresQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter?.getSearchState || ''
                    },
                    order: [
                        {
                            field: 'cost',
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

                const { data } = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.treasuresQuery.signal
                );

                this.controllers.treasuresQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initTreasures(url) {
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

            const treasures = await this.treasuresQuery(config);

            this.treasures = treasures;
            this.config.end = treasures.length < config.limit;
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

            const treasures = await this.treasuresQuery(config);

            this.config.page = config.page;
            this.config.end = treasures.length < config.limit;

            this.treasures.push(...treasures);
        },

        clearTreasures() {
            this.treasures = [];
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
                url: '/treasures'
            };
        },

        clearStore() {
            this.clearTreasures();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
