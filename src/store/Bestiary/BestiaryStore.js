import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'bestiary';

export const useBestiaryStore = defineStore('BestiaryStore', {
    state: () => ({
        bestiary: [],
        filter: useFilter(),
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/bestiary'
        },
        controllers: {
            bestiaryQuery: undefined,
            creatureInfoQuery: undefined
        }
    }),

    actions: {
        async initFilter(storeKey) {
            try {
                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/bestiary'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                await this.filter.initFilter(filterOptions);
            } catch (err) {
                errorHandler(err);
            }
        },

        async bestiaryQuery(options = {}) {
            try {
                if (this.controllers.bestiaryQuery) {
                    this.controllers.bestiaryQuery.abort();
                }

                this.controllers.bestiaryQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'exp',
                            direction: 'asc'
                        },
                        {
                            field: 'name',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                const resp = await this.$http.post(
                    this.config.url,
                    apiOptions,
                    this.controllers.bestiaryQuery.signal
                );

                this.controllers.bestiaryQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initBestiary(url) {
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

            const bestiary = await this.bestiaryQuery(config);

            this.bestiary = bestiary;
            this.config.end = bestiary.length < config.limit;
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

            const bestiary = await this.bestiaryQuery(config);

            this.config.page = config.page;
            this.config.end = bestiary.length < config.limit;

            this.bestiary.push(...bestiary);
        },

        async creatureInfoQuery(url) {
            try {
                if (this.controllers.creatureInfoQuery) {
                    this.controllers.creatureInfoQuery.abort();
                }

                this.controllers.creatureInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.creatureInfoQuery.signal);

                this.controllers.creatureInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearBestiary() {
            this.bestiary = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/bestiary'
            };
        },

        clearStore() {
            this.clearBestiary();
            this.clearConfig();
        }
    }
});
