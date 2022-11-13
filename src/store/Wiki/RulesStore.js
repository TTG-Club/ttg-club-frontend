import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'rules';

export const useRulesStore = defineStore('RulesStore', {
    state: () => ({
        rules: [],
        filter: undefined,
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/rules'
        },
        customFilter: undefined,
        controllers: {
            rulesQuery: undefined,
            ruleInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getRules: state => state.rules
    },

    actions: {
        async initFilter(storeKey, customFilter) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/rules'
                };

                if (storeKey) {
                    filterOptions.storeKey = storeKey;
                }

                if (customFilter) {
                    filterOptions.customFilter = customFilter;
                    this.customFilter = cloneDeep(customFilter);
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
        async rulesQuery(options = {}) {
            try {
                if (this.controllers.rulesQuery) {
                    this.controllers.rulesQuery.abort();
                }

                this.controllers.rulesQuery = new AbortController();

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

                if (this.customFilter) {
                    apiOptions.customFilter = this.customFilter;
                }

                const { data } = await this.$http.post(this.config.url, apiOptions, this.controllers.rulesQuery.signal);

                this.controllers.rulesQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initRules(url) {
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

            const rules = await this.rulesQuery(config);

            this.rules = rules;
            this.config.end = rules.length < config.limit;
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

            const rules = await this.rulesQuery(config);

            this.config.page = config.page;
            this.config.end = rules.length < config.limit;

            this.rules.push(...rules);
        },

        async ruleInfoQuery(url) {
            try {
                if (this.controllers.ruleInfoQuery) {
                    this.controllers.ruleInfoQuery.abort();
                }

                this.controllers.ruleInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.ruleInfoQuery.signal);

                this.controllers.ruleInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearRules() {
            this.rules = [];
        },

        clearFilter() {
            this.filter = undefined;
        },

        clearCustomFilter() {
            this.customFilter = undefined;
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/rules'
            };
        },

        clearStore() {
            this.clearRules();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
