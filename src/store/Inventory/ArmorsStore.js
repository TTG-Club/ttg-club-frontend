import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useArmorsStore = defineStore('ArmorsStore', {
    state: () => ({
        armors: [],
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

                const { data } = await this.$http.post({
                    url: this.config.url,
                    payload: apiOptions,
                    signal: this.controllers.armorsQuery.signal
                });

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

            this.armors = await this.armorsQuery(config);
        },

        async armorInfoQuery(url) {
            try {
                if (this.controllers.armorInfoQuery) {
                    this.controllers.armorInfoQuery.abort();
                }

                this.controllers.armorInfoQuery = new AbortController();

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.armorInfoQuery.signal
                });

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
