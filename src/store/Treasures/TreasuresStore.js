import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'treasures';

export const useTreasuresStore = defineStore('TreasuresStore', {
    state: () => ({
        treasures: [],
        filter: useFilter(),
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/treasures'
        },
        controllers: {
            treasuresQuery: undefined,
            treasureInfoQuery: undefined
        }
    }),

    actions: {
        async initFilter(storeKey) {
            try {
                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/treasures'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                await this.filter.initFilter(filterOptions);
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
                        value: this.filter.search || ''
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

            if (this.filter.isCustomized.value) {
                config.filter = this.filter.queryParams.value;
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

            if (this.filter.isCustomized.value) {
                config.filter = this.filter.queryParams.value;
            }

            const treasures = await this.treasuresQuery(config);

            this.config.page = config.page;
            this.config.end = treasures.length < config.limit;

            this.treasures.push(...treasures);
        },

        clearTreasures() {
            this.treasures = [];
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
            this.clearConfig();
        }
    }
});
