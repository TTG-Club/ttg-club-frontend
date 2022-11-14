import { defineStore } from 'pinia';
import sortBy from 'lodash/sortBy';
import isArray from 'lodash/isArray';
import { computed, ref } from 'vue';
import groupBy from 'lodash/groupBy';
import errorHandler from '@/common/helpers/errorHandler';
import type { ListQuery } from '@/types/DefaultTypes';
import { useAxios } from '@/common/composition/useAxios';
import type {
    TClassItem, TClassLink, TClassArchetype, TClassArchetypeList, TClassList
} from '@/views/Character/Classes/Classes';

export const useClassesStore = defineStore('ClassesStore', () => {
    const http = useAxios();
    const classes = ref<Array<TClassLink>>([]);

    const config = ref({
        page: 0,
        url: '/classes'
    });

    const controllers = ref<{
        classesQuery?: AbortController
        classInfoQuery?: AbortController
    }>({
        classesQuery: undefined,
        classInfoQuery: undefined
    });

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

    const clearClasses = () => {
        classes.value = [];
    };

    const clearConfig = () => {
        config.value = {
            page: 0,
            url: '/classes'
        };
    };

    const clearStore = () => {
        clearClasses();
        clearConfig();
    };

    const classesQuery = async (options?: ListQuery) => {
        try {
            if (controllers.value.classesQuery) {
                controllers.value.classesQuery.abort();
            }

            controllers.value.classesQuery = new AbortController();

            const apiOptions = {
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
                ...options,
                page: 0,
                limit: -1
            };

            const { data } = await http.post(
                config.value.url,
                apiOptions,
                controllers.value.classesQuery.signal
            );

            controllers.value.classesQuery = undefined;
            classes.value = data;

            return data;
        } catch (err) {
            errorHandler(err);

            return [];
        }
    };

    const classInfoQuery = async (url: string) => {
        try {
            if (controllers.value.classInfoQuery) {
                controllers.value.classInfoQuery.abort();
            }

            controllers.value.classInfoQuery = new AbortController();

            const { data } = await http.post(
                url,
                {},
                controllers.value.classInfoQuery.signal
            );

            controllers.value.classInfoQuery = undefined;

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
        }
    };

    return {
        classes,
        sortedClasses,

        classesQuery,
        classInfoQuery,
        clearStore
    };
});
