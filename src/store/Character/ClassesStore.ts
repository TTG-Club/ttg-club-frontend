import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import isArray from 'lodash/isArray';
import { computed, ref } from 'vue';
import groupBy from 'lodash/groupBy';
import errorHandler from '@/common/helpers/errorHandler';
import { useAxios } from '@/common/composition/useAxios';
import type {
    TClassItem, TClassLink, TClassArchetype, TClassArchetypeList, TClassList
} from '@/views/Character/Classes/Classes';
import type { RequestConfig } from '@/common/services/HTTPService';

export const useClassesStore = defineStore('ClassesStore', () => {
    const http = useAxios();
    const classes = ref<Array<TClassLink>>([]);

    let abortController: AbortController | null = null;

    const sortedClasses = computed((): Array<TClassList> => {
        if (!classes.value?.length) {
            return [];
        }

        const getGroupArchetypes = (list: Array<TClassArchetype>): Array<TClassArchetypeList> => sortBy(
            Object.values(groupBy(list, o => o.type.name))
                .map(value => ({
                    name: value[0].type,
                    list: value
                })),
            [o => o.name.order]
        );

        const getGroupClasses = (): Array<TClassList> => {
            const newClasses: Array<TClassItem> = classes.value.map(classItem => ({
                ...classItem,
                archetypes: getGroupArchetypes(classItem.archetypes)
            }));

            const defaultGroup: TClassList = {
                list: sortBy(
                    newClasses.filter(item => !('group' in item)),
                    [o => o.name.rus]
                )
            };

            const mapped: Array<TClassList> = sortBy(
                Object.values(groupBy(
                    newClasses.filter((item: TClassItem) => 'group' in item),
                    [(o: TClassItem) => o.group!.name]
                ) as {[key: string]: Array<TClassItem>}).map(classList => ({
                    group: classList[0].group!,
                    list: sortBy(
                        classList,
                        [o => o.name.rus]
                    )
                })),
                [o => o.group!.order]
            );

            return [defaultGroup, ...mapped];
        };

        return getGroupClasses();
    });

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
        sortedClasses,

        classesQuery,
        classInfoQuery
    };
});
