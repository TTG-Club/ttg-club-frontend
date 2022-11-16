import { defineStore } from 'pinia';
import errorHandler from '@/common/helpers/errorHandler';

export const useBooksStore = defineStore('BooksStore', {
    state: () => ({
        books: [],
        config: {
            page: 0,
            limit: 70,
            end: false,
            url: '/books'
        },
        controllers: {
            booksQuery: undefined,
            bookInfoQuery: undefined
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
                        value: this.filter.search || ''
                    },
                    order: [
                        {
                            field: 'year',
                            direction: 'asc'
                        }
                    ],
                    ...options
                };

                const { data } = await this.$http.post({
                    url: this.config.url,
                    payload: apiOptions,
                    signal: this.controllers.booksQuery.signal
                });

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

                const resp = await this.$http.post({
                    url,
                    signal: this.controllers.bookInfoQuery.signal
                });

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
            this.clearConfig();
        }
    }
});
