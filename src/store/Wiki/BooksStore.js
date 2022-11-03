import { defineStore } from 'pinia';
import cloneDeep from 'lodash/cloneDeep';
import FilterService from '@/common/services/FilterService';
import errorHandler from '@/common/helpers/errorHandler';

const DB_NAME = 'books';

// eslint-disable-next-line import/prefer-default-export
export const useBooksStore = defineStore('BooksStore', {
    state: () => ({
        books: [],
        filter: undefined,
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/books'
        },
        customFilter: undefined,
        controllers: {
            booksQuery: undefined,
            bookInfoQuery: undefined
        }
    }),

    getters: {
        getFilter: state => state.filter,
        getBooks: state => state.books
    },

    actions: {
        async initFilter(storeKey, customFilter) {
            try {
                this.clearFilter();
                this.clearCustomFilter();

                this.filter = new FilterService();

                const filterOptions = {
                    dbName: DB_NAME,
                    url: '/filters/books'
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
        async booksQuery(options = {}) {
            try {
                if (this.controllers.booksQuery) {
                    this.controllers.booksQuery.abort();
                }

                this.controllers.booksQuery = new AbortController();

                const apiOptions = {
                    page: 0,
                    limit: -1,
                    search: {
                        exact: false,
                        value: this.filter?.getSearchState || ''
                    },
                    order: [
                        {
                            field: 'year',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                if (this.customFilter) {
                    apiOptions.customFilter = this.customFilter;
                }

                const { data } = await this.$http.post(this.config.url, apiOptions, this.controllers.booksQuery.signal);

                this.controllers.booksQuery = undefined;

                return data;
            } catch (err) {
                errorHandler(err);

                return [];
            }
        },

        async initBooks(url) {
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

            const books = await this.booksQuery(config);

            this.books = books;
            this.config.end = books.length < config.limit;
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

            const books = await this.booksQuery(config);

            this.config.page = config.page;
            this.config.end = books.length < config.limit;

            this.books.push(...books);
        },

        async bookInfoQuery(url) {
            try {
                if (this.controllers.bookInfoQuery) {
                    this.controllers.bookInfoQuery.abort();
                }

                this.controllers.bookInfoQuery = new AbortController();

                const resp = await this.$http.post(url, {}, this.controllers.bookInfoQuery.signal);

                this.controllers.bookInfoQuery = undefined;

                return resp.data;
            } catch (err) {
                errorHandler(err);

                return undefined;
            }
        },

        clearBooks() {
            this.books = [];
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
                url: '/books'
            };
        },

        clearStore() {
            this.clearBooks();
            this.clearFilter();
            this.clearConfig();
        }
    }
});
