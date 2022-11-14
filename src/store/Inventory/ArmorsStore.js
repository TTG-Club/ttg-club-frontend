import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'armors';

export const useArmorsStore = defineStore('ArmorsStore', {
    state: () => ({
        armors: [],
        filter: useFilter(),
        config: {
            page: 0,
            url: '/armors'
        },
        controllers: {
            armorsQuery: undefined,
            armorInfoQuery: undefined
        }
    }),

    actions: {
        async initFilter(storeKey, url) {
            try {
                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/armors'
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
        async armorsQuery(options = {}) {
            try {
                if (this.controllers.armorsQuery) {
                    this.controllers.armorsQuery.abort();
                }

                this.controllers.armorsQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'AC',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                const { data } = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.armorsQuery.signal
                );

                this.controllers.armorsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initArmors(url) {
            this.clearConfig();

            if (url) {
                this.config.url = url;
            }

            const config = {
                page: this.config.page
            };

            if (this.filter.isCustomized.value) {
                config.filter = this.filter.queryParams.value;
            }

            this.armors = await this.armorsQuery(config);
        },

        async armorInfoQuery(url) {
            try {
                if (this.controllers.armorInfoQuery) {
                    this.controllers.armorInfoQuery.abort();
                }

                this.controllers.armorInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.armorInfoQuery.signal);

                this.controllers.armorInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearArmors() {
            this.armors = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                url: '/armors'
            };
        },

        clearStore() {
            this.clearArmors();
            this.clearConfig();
        }
    }
});
