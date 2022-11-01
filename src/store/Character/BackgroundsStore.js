import { defineStore } from 'pinia';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'backgrounds';

// eslint-disable-next-line import/prefer-default-export
export const useBackgroundsStore = defineStore('BackgroundsStore', {
    state: () => ({
        backgrounds: [],
        filter: undefined,
        config: {
            page: 0,
            limit: -1,
            end: false,
            url: '/backgrounds'
        },
        controllers: {
            backgroundsQuery: undefined,
            backgroundInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getBackgrounds: state => state.backgrounds
    },

    actions: {
        async initFilter(storeKey, url) {
            try {
                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/backgrounds'
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
        async backgroundsQuery(options = {}) {
            try {
                if (this.controllers.backgroundsQuery) {
                    this.controllers.backgroundsQuery.abort();
                }

                this.controllers.backgroundsQuery = new AbortController();

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
                    this.controllers.backgroundsQuery.signal
                );

                this.controllers.backgroundsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initBackgrounds(url) {
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

            const backgrounds = await this.backgroundsQuery(config);

            this.backgrounds = backgrounds;
            this.config.end = backgrounds.length < config.limit;
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

            const backgrounds = await this.backgroundsQuery(config);

            this.config.page = config.page;
            this.config.end = backgrounds.length < config.limit;

            this.backgrounds.push(...backgrounds);
        },

        async backgroundInfoQuery(url) {
            try {
                if (this.controllers.backgroundInfoQuery) {
                    this.controllers.backgroundInfoQuery.abort();
                }

                this.controllers.backgroundInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.backgroundInfoQuery.signal);

                this.controllers.backgroundInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearBackgrounds() {
            this.backgrounds = [];
        },

        clearFilter() {
            this.filter = undefined;
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: -1,
                end: false,
                url: '/backgrounds'
            };
        },

        clearStore() {
            this.clearBackgrounds();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
