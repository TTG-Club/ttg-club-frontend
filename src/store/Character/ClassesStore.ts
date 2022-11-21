import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import isArray from 'lodash/isArray';
import { ref } from 'vue';
import errorHandler from '@/common/helpers/errorHandler';
import { useAxios } from '@/common/composition/useAxios';
import type { TClassLink } from '@/types/Character/Classes.types';
import type { RequestConfig } from '@/common/services/HTTPService';

export const useClassesStore = defineStore('ClassesStore', () => {
    const http = useAxios();
    const classes = ref<Array<TClassLink>>([]);

    let abortController: AbortController | null = null;

    const classesQuery = async (options: RequestConfig) => {
        try {
            const { data } = await http.post(options);

            classes.value = data;

            return data;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const classInfoQuery = async (url: string) => {
        if (abortController) {
            abortController.abort();
        }

        try {
            abortController = new AbortController();

            const { data } = await http.post({
                url,
                signal: abortController.signal
            });

            let images: Array<string> = [];

            if (isArray(data.images) && data.images.length) {
                images = [...data.images];
            }

            if ((!isArray(data.images) || !data.images?.length) && data.image) {
                images.push(data.image);
            }

            return {
                ...data,
                images,
                tabs: sortBy(data.tabs, ['order'])
            };
        } catch (err) {
            errorHandler(err);

            return undefined;
        } finally {
            abortController = null;
        }
    };

    return {
        classes,

        classesQuery,
        classInfoQuery
    };
});
