import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import FilterService from '@/common/services/FilterService';

const DB_NAME = 'races';

// eslint-disable-next-line import/prefer-default-export
export const useRacesStore = defineStore('RacesStore', {
    state: () => ({
        races: [],
        filter: undefined,
        config: {
            page: 0,
            limit: -1,
            end: false,
            url: '/races'
        },
        controllers: {
            racesQuery: undefined,
            raceInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getRaces: state => state.races
    },

    actions: {
        async initFilter(storeKey, url) {
            try {
                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/races'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                if (url) {
                    filterOptions.url = url;
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
        async racesQuery(options = {}) {
            try {
                if (this.controllers.racesQuery) {
                    this.controllers.racesQuery.abort();
                }

                this.controllers.racesQuery = new AbortController();

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

                const { data } = await this.$http.post(this.config.url, apiOptions, this.controllers.racesQuery.signal);

                this.controllers.racesQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initRaces(url) {
            this.clearConfig();

            if (url) {
                this.config.url = url;
            }

            const config = {
                page: this.config.page,
                limit: this.config.limit
            };

            if (this.filter && this.filter.isCustomized) {
                config.filter = this.filter.getQueryParams;
            }

            const races = await this.racesQuery(config);

            this.races = races;
            this.config.end = races.length < config.limit;
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

            const races = await this.racesQuery(config);

            this.config.page = config.page;
            this.config.end = races.length < config.limit;

            this.races.push(...races);
        },

        async raceInfoQuery(url) {
            try {
                if (this.controllers.raceInfoQuery) {
                    this.controllers.raceInfoQuery.abort();
                }

                this.controllers.raceInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.raceInfoQuery.signal);

                this.controllers.raceInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearRaces() {
            this.races = [];
        },

        clearFilter() {
            this.filter = undefined;
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: -1,
                end: false,
                url: '/races'
            };
        },

        clearStore() {
            this.clearRaces();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
