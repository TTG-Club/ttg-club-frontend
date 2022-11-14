import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'items';

export const useItemsStore = defineStore('ItemsStore', {
    state: () => ({
        items: [],
        filter: useFilter(),
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/items'
        },
        controllers: {
            itemsQuery: undefined,
            itemInfoQuery: undefined
        }
    }),

    actions: {
        async initFilter(storeKey) {
            try {
                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/items'
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
        async itemsQuery(options = {}) {
            try {
                if (this.controllers.itemsQuery) {
                    this.controllers.itemsQuery.abort();
                }

                this.controllers.itemsQuery = new AbortController();

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

                const { data } = await this.$http.post(this.config.url, apiOptions, this.controllers.itemsQuery.signal);

                this.controllers.itemsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initItems(url) {
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

            const items = await this.itemsQuery(config);

            this.items = items;
            this.config.end = items.length < config.limit;
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

            const items = await this.itemsQuery(config);

            this.config.page = config.page;
            this.config.end = items.length < config.limit;

            this.items.push(...items);
        },

        async itemInfoQuery(url) {
            try {
                if (this.controllers.itemInfoQuery) {
                    this.controllers.itemInfoQuery.abort();
                }

                this.controllers.itemInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.itemInfoQuery.signal);

                this.controllers.itemInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearItems() {
            this.items = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/items'
            };
        },

        clearStore() {
            this.clearItems();
            this.clearConfig();
        }
    }
});
