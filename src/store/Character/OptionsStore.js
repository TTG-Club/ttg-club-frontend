import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';
import errorHandler from '@/common/helpers/errorHandler';

export const useOptionsStore = defineStore('OptionsStore', {
    state: () => ({
        options: [],
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

    actions: {
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
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'name',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                const { data } = await this.$http.post({
                    url: this.config.url,
                    payload: apiOptions,
                    signal: this.controllers.optionsQuery.signal
                });

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

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.optionInfoQuery.signal
                });

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
            this.clearConfig();
        }
    }
});
