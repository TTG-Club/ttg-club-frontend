import localforage from 'localforage';
import cloneDeep from 'lodash/cloneDeep';
import HTTPService from '@/common/services/HTTPService';
import errorHandler from '@/common/helpers/errorHandler';

export default class FilterService {
    constructor() {
        this.http = new HTTPService();
        this.filter = undefined;
        this.search = '';
    }

    get getFilterState() {
        return this.filter;
    }

    get getSearchState() {
        return this.search;
    }

    get isCustomized() {
        let status = false;

        if (!this.getFilterState) {
            return status;
        }

        const isValueCustomized = value => value.default !== value.value;

        const isValuesCustomized = values => {
            let customized = false;

            for (let i = 0; i < values.length && !customized; i++) {
                customized = isValueCustomized(values[i]);
            }

            return customized;
        };

        const isBlockCustomized = block => {
            if ('value' in block) {
                return isValueCustomized(block.value);
            }

            return isValuesCustomized(block.values);
        };

        if (Array.isArray(this.filter)) {
            for (let i = 0; i < this.filter.length && !status; i++) {
                status = isBlockCustomized(this.filter[i]);
            }
        }

        const values = Object.values(this.filter);

        for (let i = 0; i < values.length && !status; i++) {
            const blocks = values[i];

            for (let j = 0; j < blocks.length && !status; j++) {
                status = isBlockCustomized(blocks[j]);
            }
        }

        return status;
    }

    get getQueryParams() {
        const params = {};

        const setBlockToParams = block => {
            for (const group of block) {
                if (group.value) {
                    params[group.key] = group.value;

                    continue;
                }

                params[group.key] = group.values
                    .filter(val => val.value)
                    .map(val => val.key);
            }
        };

        if (Array.isArray(this.filter)) {
            for (const block of this.filter) {
                setBlockToParams(block);
            }
        }

        for (const [key, block] of Object.entries(this.filter)) {
            if (key === 'sources') {
                params.book = [];

                for (const group of block) {
                    for (const book of group.values) {
                        if (book.value) {
                            params.book.push(book.key);
                        }
                    }
                }

                continue;
            }

            setBlockToParams(block);
        }

        return params;
    }

    /**
     * @param {{dbName: string, url: string, storeName: string, storeKey: string}} options
     * @returns {Promise<void>}
     */
    async init(options) {
        const opts = {
            dbName: undefined,
            url: undefined,
            storeName: 'filters',
            storeKey: 'core',
            ...options
        };

        if (!opts.url) {
            throw new Error('URL is not defined');
        }

        if (!opts.dbName) {
            throw new Error('dbName is not defined');
        }

        if (!opts.storeName) {
            throw new Error('storeName is not defined');
        }

        if (!opts.storeKey) {
            throw new Error('storeKey is not defined');
        }

        try {
            this.storeKey = opts.storeKey;

            this.store = localforage.createInstance({
                name: opts.dbName,
                storeName: opts.storeName
            });

            const setStore = async filter => {
                const restored = await this.getRestored(filter);

                if (!restored) {
                    return;
                }

                this.filter = restored;

                await this.store.setItem(this.storeKey, restored);
            };

            const resp = await this.http.post(opts.url);

            if (!resp.data || resp.status !== 200) {
                return;
            }

            await setStore(resp.data);
        } catch (err) {
            errorHandler(err);
        }
    }

    async getRestored(filter) {
        let restoredFilter;
        let filterKey;

        await this.store.ready();

        const copy = cloneDeep(filter);
        const saved = await this.store.getItem(this.storeKey);

        const copyIsNewType = (Array.isArray(copy) && !Array.isArray(saved))
            || (!Array.isArray(copy) && Array.isArray(saved));

        const getRestoredValue = (value, key) => {
            if (!saved || copyIsNewType) {
                return value.default;
            }

            let savedBlock;

            if (!filterKey) {
                savedBlock = saved.find(block => block.key === key);
            }

            if (filterKey) {
                savedBlock = saved[filterKey].find(block => block.key === key);
            }

            if (!savedBlock) {
                return value.default;
            }

            if ('value' in savedBlock) {
                return savedBlock.value;
            }

            const savedValue = savedBlock.values
                ?.find(val => val.key === value.key);

            if (!savedValue) {
                return value.default;
            }

            return savedValue.value;
        };

        const getRestoredValues = (values, key) => {
            const restored = [];

            for (let i = 0; i < values.length; i++) {
                restored.push({
                    ...values[i],
                    value: getRestoredValue(values[i], key)
                });
            }

            return restored;
        };

        const getRestoredBlock = block => {
            if ('value' in block) {
                return {
                    ...block,
                    value: getRestoredValue(block.value, block.key)
                };
            }

            return {
                ...block,
                values: getRestoredValues(block.values, block.key)
            };
        };

        if (Array.isArray(copy)) {
            restoredFilter = [];

            for (let i = 0; i < copy.length; i++) {
                restoredFilter.push(getRestoredBlock(copy[i]));
            }

            return restoredFilter;
        }

        restoredFilter = {};

        const entries = Object.entries(copy);

        for (let i = 0; i < entries.length; i++) {
            const [key, blocks] = entries[i];

            filterKey = key;
            restoredFilter[key] = [];

            for (let j = 0; j < blocks.length; j++) {
                restoredFilter[key].push(getRestoredBlock(blocks[j]));
            }
        }

        return restoredFilter;
    }

    async reset() {
        await this.store.ready();

        const copy = cloneDeep(this.filter);

        let initialFilter;

        const getWithDefaults = val => {
            if ('value' in val) {
                return {
                    ...val,
                    value: val.default
                };
            }

            const values = [];

            for (let i = 0; i < val.values.length; i++) {
                values.push(getWithDefaults(val.values[i]));
            }

            return {
                ...val,
                values
            };
        };

        if (Array.isArray(copy)) {
            initialFilter = [];

            for (let i = 0; i < copy.length; i++) {
                initialFilter.push(getWithDefaults(copy[i]));
            }

            await this.save(initialFilter);

            return initialFilter;
        }

        initialFilter = {};

        const keys = Object.keys(copy);

        for (let i = 0; i < keys.length; i++) {
            initialFilter[keys[i]] = [];

            for (let j = 0; j < copy[keys[i]].length; j++) {
                initialFilter[keys[i]].push(getWithDefaults(copy[keys[i]][j]));
            }
        }

        await this.save(initialFilter);

        return initialFilter;
    }

    async save(filter) {
        await this.store.ready();

        const clone = cloneDeep(filter);

        this.filter = clone;

        if (!this.isCustomized) {
            await this.store.removeItem(this.storeKey);

            return;
        }

        await this.store.setItem(this.storeKey, clone);
    }

    updateSearch(searchStr = '') {
        return new Promise((resolve, reject) => {
            if (typeof searchStr !== 'string') {
                reject(Error('searchStr is not a string'));

                return;
            }

            this.search = searchStr;

            resolve();
        });
    }
}
