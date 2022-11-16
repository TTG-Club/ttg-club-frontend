import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useGodsStore = defineStore('GodsStore', {
    state: () => ({
        gods: [],
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/gods'
        },
        controllers: {
            godsQuery: undefined,
            godInfoQuery: undefined
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
                    signal: this.controllers.godsQuery.signal
                });

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

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.godInfoQuery.signal
                });

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
            this.clearConfig();
        }
    }
});
