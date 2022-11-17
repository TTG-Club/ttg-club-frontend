import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import type { TRaceLink } from '@/views/Character/Races/Races';
import { useAxios } from '@/common/composition/useAxios';
import type { RequestConfig } from '@/common/services/HTTPService';

export const useRacesStore = defineStore('RacesStore', () => {
    const http = useAxios();
    const races = ref<Array<TRaceLink>>([]);

    let abortController: AbortController | null;

    const race = computed(() => (url: TRaceLink['url']) => races.value.find(item => item.url === url));

    const clearStore = () => {
        races.value = [];
    };

    const racesQuery = async (options: RequestConfig = {
        url: '/races'
    }) => {
        try {
            const { data } = await http.post(options);

            races.value = data;

            return data;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const raceInfoQuery = async (url: string) => {
        if (abortController) {
            abortController.abort();
        }

        try {
            abortController = new AbortController();

            const resp = await http.post({
                url,
                signal: abortController.signal
            });

            return resp.data;
        } catch (err) {
            errorHandler(err);

            return undefined;
        } finally {
            abortController = null;
        }
    };

    return {
        races,

        race,

        racesQuery,
        raceInfoQuery,
        clearStore
    };
});
