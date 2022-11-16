import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useWeaponsStore = defineStore('WeaponsStore', {
    state: () => ({
        weapons: [],
        config: {
            page: 0,
            url: '/weapons'
        },
        controllers: {
            weaponsQuery: undefined,
            weaponInfoQuery: undefined
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
        async weaponsQuery(options = {}) {
            try {
                if (this.controllers.weaponsQuery) {
                    this.controllers.weaponsQuery.abort();
                }

                this.controllers.weaponsQuery = new AbortController();

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
                    signal: this.controllers.weaponsQuery.signal
                });

                this.controllers.weaponsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initWeapons(url) {
            this.clearConfig();

            if (url) {
                this.config.url = url;
            }

            const config = {
                page: this.config.page
            };

            this.weapons = await this.weaponsQuery(config);
        },

        async weaponInfoQuery(url) {
            try {
                if (this.controllers.weaponInfoQuery) {
                    this.controllers.weaponInfoQuery.abort();
                }

                this.controllers.weaponInfoQuery = new AbortController();

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.weaponInfoQuery.signal
                });

                this.controllers.weaponInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearWeapons() {
            this.weapons = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                url: '/weapons'
            };
        },

        clearStore() {
            this.clearWeapons();
            this.clearConfig();
        }
    }
});
