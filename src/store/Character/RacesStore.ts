import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import { computed, ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import type { TRaceLink } from '@/views/Character/Races/Races';
import { useAxios } from '@/common/composition/useAxios';
import type { ListQuery } from '@/types/DefaultTypes';

export const useRacesStore = defineStore('RacesStore', () => {
    const http = useAxios();
    const races = ref<Array<TRaceLink>>([]);

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

    const racesQuery = async (options?: ListQuery) => {
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
                    value: ''
                },
                order: [
                    {
                        field: 'name',
                        direction: 'asc'
                    }
                ],
                ...options
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

    const initRaces = async (options?: ListQuery) => {
        races.value = await racesQuery({
            ...options,
            page: 0,
            limit: -1
        });

        config.value.end = races.value.length < config.value.limit;
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

        race,
        subRaces,

        racesQuery,
        initRaces,
        raceInfoQuery,
        clearRaces,
        clearConfig,
        clearStore
    };
});
