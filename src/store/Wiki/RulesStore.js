import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useRulesStore = defineStore('RulesStore', {
    state: () => ({
        rules: [],
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/rules'
        },
        controllers: {
            rulesQuery: undefined,
            ruleInfoQuery: undefined
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
                    signal: this.controllers.rulesQuery.signal
                });

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

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.ruleInfoQuery.signal
                });

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
            this.clearConfig();
        }
    }
});
