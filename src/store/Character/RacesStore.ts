import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import { computed, ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import type { TRaceLink } from '@/views/Character/Races/Races';
import { useAxios } from '@/common/composition/useAxios';
import { useFilter } from '@/common/composition/useFilter';

const DB_NAME = 'races';

type TQuery = {
    page?: number
    limit?: number
    filter?: any
    search?: {
        exact?: boolean
        value?: string
    },
    order?: Array<{
        field: string
        direction: 'asc' | 'desc'
    }>
}

export const useRacesStore = defineStore('RacesStore', () => {
    const http = useAxios();
    const races = ref<Array<TRaceLink>>([]);
    const filter = useFilter();

    const config = ref<{
        page: number
        limit: number
        end: boolean
        url: '/races' | string
    }>({
        page: 0,
        limit: -1,
        end: false,
        url: '/races'
    });

    const controllers = ref<{
        racesQuery?: AbortController
        raceInfoQuery?: AbortController
    }>({
        racesQuery: undefined,
        raceInfoQuery: undefined
    });

    const race = computed(() => (url: TRaceLink['url']) => races.value.find(item => item.url === url));

    const subRaces = computed(() => (raceItem: TRaceLink) => {
        if (isArray(raceItem.subraces)) {
            return sortBy(
                Object.values(groupBy(raceItem.subraces, o => o.type.name))
                    .map(value => ({
                        name: value[0].type,
                        list: value
                    })),
                [o => o.name.order]
            );
        }

        return null;
    });

    const clearRaces = () => {
        races.value = [];
    };

    const clearConfig = () => {
        config.value = {
            page: 0,
            limit: -1,
            end: false,
            url: '/races'
        };
    };

    const clearStore = () => {
        clearRaces();
        clearConfig();
    };

    const initFilter = async (storeKey?: string, url?: string) => {
        try {
            const filterOptions: {
                dbName: typeof DB_NAME
                url: '/filters/races' | string
                storeKey?: string
                storeName?: string
            } = {
                dbName: DB_NAME,
                url: '/filters/races'
            };

            if (storeKey) {
                filterOptions.storeKey = storeKey;
            }

            if (url) {
                filterOptions.url = url;
            }

            await filter.initFilter(filterOptions);
        } catch (err) {
            errorHandler(err);
        }
    };

    const racesQuery = async (options?: TQuery) => {
        try {
            if (controllers.value.racesQuery) {
                controllers.value.racesQuery.abort();
            }

            controllers.value.racesQuery = new AbortController();

            let apiOptions = {
                page: 0,
                limit: -1,
                search: {
                    exact: false,
                    value: filter.search.value || ''
                },
                order: [
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ]
            };

            if (options) {
                apiOptions = Object.assign(apiOptions, options);
            }

            const { data } = await http.post(config.value.url, apiOptions, controllers.value.racesQuery.signal);

            controllers.value.racesQuery = undefined;

            return data;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const initRaces = async (url?: string) => {
        clearConfig();

        if (url) {
            config.value.url = url;
        }

        const configObj: TQuery = {
            page: config.value.page,
            limit: config.value.limit
        };

        if (filter.isCustomized.value) {
            configObj.filter = filter.queryParams.value;
        }

        races.value = await racesQuery(configObj);
        config.value.end = races.value.length < config.value.limit;
    };

    const nextPage = async () => {
        if (config.value.end) {
            return;
        }

        const configObj: TQuery = {
            page: config.value.page + 1,
            limit: config.value.limit
        };

        if (filter.isCustomized.value) {
            configObj.filter = filter.queryParams.value;
        }

        const racesList = await racesQuery(configObj);

        config.value.page = configObj.page as number;
        config.value.end = racesList.length < config.value.limit;

        races.value.push(...racesList);
    };

    const raceInfoQuery = async (url: string) => {
        try {
            if (controllers.value.raceInfoQuery) {
                controllers.value.raceInfoQuery.abort();
            }

            controllers.value.raceInfoQuery = new AbortController();

            const resp = await http.post(url, {}, controllers.value.raceInfoQuery.signal);

            controllers.value.raceInfoQuery = undefined;

            return resp.data;
        } catch (err) {
            errorHandler(err);

            return undefined;
        }
    };

    return {
        races,
        filter,

        race,
        subRaces,

        initFilter,
        racesQuery,
        initRaces,
        nextPage,
        raceInfoQuery,
        clearRaces,
        clearConfig,
        clearStore
    };
});
