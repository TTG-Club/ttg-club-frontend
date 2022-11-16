import { defineStore } from 'pinia';
import { ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import { useAxios } from '@/common/composition/useAxios';
import type { RequestConfig } from '@/common/services/HTTPService';
import type { TBestiaryLink } from '@/views/Character/Backgrounds/Bestiary';

export const useBestiaryStore = defineStore('BestiaryStore', () => {
    const http = useAxios();
    const bestiary = ref<Array<TBestiaryLink>>([]);

    let abortController: AbortController | null = null;

    const bestiaryQuery = async (options: RequestConfig, nextPage = false): Promise<Array<TBestiaryLink>> => {
        try {
            const resp = await http.post(options);

            if (nextPage) {
                bestiary.value.push(...resp.data);
            }

            if (!nextPage) {
                bestiary.value = resp.data;
            }

            return resp.data;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const creatureInfoQuery = async (url: string) => {
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
        bestiary,

        bestiaryQuery,
        creatureInfoQuery
    };
});
