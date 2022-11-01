import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'options';

// eslint-disable-next-line import/prefer-default-export
export const useOptionsStore = defineStore('OptionsStore', {
    state: () => ({
        options: [],
        filter: undefined,
        config: {
            page: 0,
            limit: -1,
            end: false,
            url: '/options'
        },
        controllers: {
            optionsQuery: undefined,
            optionInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getOptions: state => state.options
    },

    actions: {
        async initFilter(storeKey, url) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: url || '/filters/options'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
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
        async optionsQuery(options = {}) {
            try {
                if (this.controllers.optionsQuery) {
                    this.controllers.optionsQuery.abort();
                }

                this.controllers.optionsQuery = new AbortController();

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
                    this.controllers.optionsQuery.signal
                );

                this.controllers.optionsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initOptions(books) {
            this.clearConfig();

            const config = {
                page: this.config.page,
                limit: this.config.limit
            };

            if (this.filter) {
                config.filter = this.filter.getQueryParams;
            }

            if (isArray(books) && books.length) {
                config.filter.book = books;
            }

            const options = await this.optionsQuery(config);

            this.options = options;
            this.config.end = options.length < config.limit;
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

            const options = await this.optionsQuery(config);

            this.config.page = config.page;
            this.config.end = options.length < config.limit;

            this.options.push(...options);
        },

        async optionInfoQuery(url) {
            try {
                if (this.controllers.optionInfoQuery) {
                    this.controllers.optionInfoQuery.abort();
                }

                this.controllers.optionInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.optionInfoQuery.signal);

                this.controllers.optionInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearOptions() {
            this.options = [];
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
                limit: -1,
                end: false,
                url: '/options'
            };
        },

        clearStore() {
            this.clearOptions();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
