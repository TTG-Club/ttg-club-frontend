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
        computed, defineComponent, onBeforeMount
    } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useUIStore } from "@/store/UI/UIStore";
    import ClassLink from "@/views/Character/Classes/ClassLink.vue";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useClassesStore } from '@/store/Character/ClassesStore';
    import { useFilter } from '@/common/composition/useFilter';
    import { ClassesFilterDefaults } from '@/enums/Character/ClassesEnum';
    import usePagination from '@/common/composition/usePagination';

    export default defineComponent({
        name: 'ClassesView',
        components: {
            ClassLink,
            ContentLayout
        },
        setup() {
            const uiStore = useUIStore();
            const classesStore = useClassesStore();
            const route = useRoute();

            const filter = useFilter({
                dbName: ClassesFilterDefaults.dbName,
                url: ClassesFilterDefaults.url
            });

            const { isMobile, fullscreen } = storeToRefs(uiStore);
            const { sortedClasses } = storeToRefs(classesStore);

            const { initPages } = usePagination({
                url: '/classes',
                loadFn: classesStore.classesQuery,
                limit: -1,
                filter: {
                    isCustomized: filter.isCustomized.value,
                    value: filter.queryParams.value
                },
                search: filter.search
            });

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
