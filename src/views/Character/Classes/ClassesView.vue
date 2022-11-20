<template>
    <content-layout
        :filter-instance="filter"
        :show-right-side="showRightSide"
        @search="initPages"
        @update="initPages"
    >
        <div
            class="class-items"
            :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
        >
            <div
                v-for="(group, groupKey) in sortedClasses"
                :key="groupKey"
                class="class-items__group"
            >
                <div
                    v-if="group.group?.name"
                    class="class-items__group_name"
                >
                    {{ group.group.name }}
                </div>

                <div class="class-items__group_list">
                    <class-link
                        v-for="el in group.list"
                        :key="el.url"
                        :after-search="!!filter.search.value"
                        :class-item="el"
                        :to="{ path: el.url }"
                    />
                </div>
            </div>
        </div>
    </content-layout>
</template>

<script lang="ts">
    import { useRoute } from 'vue-router';
    import {
        computed, defineComponent, onBeforeMount, provide
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import sortBy from 'lodash/sortBy';
    import groupBy from 'lodash/groupBy';
    import { useUIStore } from "@/store/UI/UIStore";
    import ClassLink from "@/views/Character/Classes/ClassLink.vue";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useFilter } from '@/common/composition/useFilter';
    import usePagination from '@/common/composition/usePagination';
    import type {
        TClassArchetype, TClassArchetypeList, TClassItem, TClassList
    } from '@/types/Classes.types';
    import { ClassesFilterDefaults } from '@/types/Classes.types';

    export default defineComponent({

        components: {
            ClassLink,
            ContentLayout
        },
        setup() {
            const uiStore = useUIStore();
            const route = useRoute();

            const filter = useFilter({
                dbName: ClassesFilterDefaults.dbName,
                url: ClassesFilterDefaults.url
            });

            const { isMobile, fullscreen } = storeToRefs(uiStore);

            const { initPages, items: classes } = usePagination({
                url: '/classes',
                limit: -1,
                filter: {
                    isCustomized: filter.isCustomized,
                    value: filter.queryParams
                },
                search: filter.search
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

            provide('queryParams', () => filter.queryParams.value);

            onBeforeMount(async () => {
                await filter.initFilter();
                await initPages();
            });

            return {
                isMobile,
                fullscreen,
                sortedClasses,
                showRightSide: computed(() => route.name === 'classDetail'),
                filter,
                initPages
            };
        }
    });
</script>

<style lang="scss" scoped>
    .class-items {
        &__group {
            &_name {
                font-size: var(--h3-font-size);
                font-weight: 300;
                margin: 24px 0 16px 0;
                color: var(--text-color-title);
                position: relative;
                font-family: 'Lora';
            }

            &_list {
                width: 100%;
                padding: 0;
                display: grid;
                grid-gap: 16px;
                align-items: start;
                grid-template-columns: repeat(1, 1fr);

                @include media-min($md) {
                    grid-template-columns: repeat(2, 1fr);
                }

                @include media-min($xl) {
                    grid-template-columns: repeat(3, 1fr);
                }
            }
        }

        &.is-selected {
            .class-items {
                &__group {
                    &_list {
                        @include media-min($md) {
                            grid-template-columns: repeat(1, 1fr);
                        }
                    }
                }
            }
        }
    }
</style>
