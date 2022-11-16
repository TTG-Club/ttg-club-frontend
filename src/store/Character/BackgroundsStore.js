import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useBackgroundsStore = defineStore('BackgroundsStore', {
    state: () => ({
        backgrounds: [],
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
                    signal: this.controllers.backgroundsQuery.signal
                });

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

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.backgroundInfoQuery.signal
                });

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
            this.clearConfig();
        }
    }
});
