import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';
import errorHandler from '@/common/helpers/errorHandler';

export const useSpellsStore = defineStore('SpellsStore', {
    state: () => ({
        spells: [],
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/spells'
        },
        controllers: {
            spellsQuery: undefined,
            spellInfoQuery: undefined
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
        async spellsQuery(options = {}) {
            try {
                if (this.controllers.spellsQuery) {
                    this.controllers.spellsQuery.abort();
                }

                this.controllers.spellsQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'level',
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
                    signal: this.controllers.spellsQuery.signal
                });

                this.controllers.spellsQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initSpells(books) {
            this.clearConfig();

            const config = {
                page: this.config.page,
                limit: this.config.limit
            };

            if (isArray(books) && books.length) {
                config.filter.book = books;
            }

            const spells = await this.spellsQuery(config);

            this.spells = spells;
            this.config.end = spells.length < config.limit;
        },

        async nextPage(books) {
            if (this.config.end) {
                return;
            }

            const config = {
                page: this.config.page + 1,
                limit: this.config.limit
            };

            if (isArray(books) && books.length) {
                config.filter.book = books;
            }

            const spells = await this.spellsQuery(config);

            this.config.page = config.page;
            this.config.end = spells.length < config.limit;

            this.spells.push(...spells);
        },

        async spellInfoQuery(url) {
            try {
                if (this.controllers.spellInfoQuery) {
                    this.controllers.spellInfoQuery.abort();
                }

                this.controllers.spellInfoQuery = new AbortController();

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.spellInfoQuery.signal
                });

                this.controllers.spellInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearSpells() {
            this.spells = [];
        },

        clearConfig() {
            this.config = {
                page: 0,
                limit: 70,
                end: false,
                url: '/spells'
            };
        },

        clearStore() {
            this.clearSpells();
            this.clearConfig();
        }
    }
});
