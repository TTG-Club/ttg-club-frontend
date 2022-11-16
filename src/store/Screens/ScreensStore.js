import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useScreensStore = defineStore('ScreensStore', {
    state: () => ({
        screens: [],
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/screens'
        },
        controllers: {
            screensQuery: undefined,
            screenInfoQuery: undefined
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
        async screensQuery(options = {}) {
            try {
                if (this.controllers.screensQuery) {
                    this.controllers.screensQuery.abort();
                }

                this.controllers.screensQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'ordering',
                            direction: 'asc'
                        },
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
                    signal: this.controllers.screensQuery.signal
                });

                this.controllers.screensQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initScreens(url) {
            this.clearConfig();

            if (url) {
                this.config.url = url;
            }

            const config = {
                page: this.config.page,
                limit: this.config.limit
            };

            const screens = await this.screensQuery(config);

            this.screens = screens;
            this.config.end = screens.length < config.limit;
        },

        async nextPage() {
            if (this.config.end) {
                return;
            }

            const config = {
                page: this.config.page + 1,
                limit: this.config.limit
            };

            const screens = await this.screensQuery(config);

            this.config.page = config.page;
            this.config.end = screens.length < config.limit;

            this.screens.push(...screens);
        },

        async screenInfoQuery(url) {
            try {
                if (this.controllers.screenInfoQuery) {
                    this.controllers.screenInfoQuery.abort();
                }

                this.controllers.screenInfoQuery = new AbortController();

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.screenInfoQuery.signal
                });

                this.controllers.screenInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearScreens() {
            this.screens = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/screens'
            };
        },

        clearStore() {
            this.clearScreens();
            this.clearConfig();
        }
    }
});
