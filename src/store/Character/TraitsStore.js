import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'traits';

export const useTraitsStore = defineStore('TraitsStore', {
    state: () => ({
        traits: [],
        filter: useFilter(),
        config: {
            page: 0,
            limit: -1,
            end: false,
            url: '/traits'
        },
        controllers: {
            traitsQuery: undefined,
            traitInfoQuery: undefined
        }
    }),

    actions: {
        async initFilter(storeKey, url) {
            try {
                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/traits'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                if (url) {
                    filterOptions.url = url;
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
        async traitsQuery(options = {}) {
            try {
                if (this.controllers.traitsQuery) {
                    this.controllers.traitsQuery.abort();
                }

                this.controllers.traitsQuery = new AbortController();

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

                const { data } = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.traitsQuery.signal
                );

                this.controllers.traitsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initTraits(url) {
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

            const traits = await this.traitsQuery(config);

            this.traits = traits;
            this.config.end = traits.length < config.limit;
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

            const traits = await this.traitsQuery(config);

            this.config.page = config.page;
            this.config.end = traits.length < config.limit;

            this.traits.push(...traits);
        },

        async traitInfoQuery(url) {
            try {
                if (this.controllers.traitInfoQuery) {
                    this.controllers.traitInfoQuery.abort();
                }

                this.controllers.traitInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.traitInfoQuery.signal);

                this.controllers.traitInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearTraits() {
            this.traits = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: -1,
                end: false,
                url: '/traits'
            };
        },

        clearStore() {
            this.clearTraits();
            this.clearConfig();
        }
    }
});
