<template>
    <content-layout
        :filter-instance="classesStore.filter"
        :show-right-side="showRightSide"
        @search="onSearch"
        @update="classesQuery"
    >
        <div
            ref="classes"
            class="class-items"
            :class="{ 'is-selected': showRightSide, 'is-fullscreen': fullscreen }"
        >
            <div
                v-for="(group, groupKey) in classes"
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
                        :after-search="!!search"
                        :class-item="el"
                        :to="{ path: el.url }"
                    />
                </div>
            </div>
        </div>
    </content-layout>
</template>

<script>
    import sortBy from "lodash/sortBy";
    import groupBy from "lodash/groupBy";
    import debounce from "lodash/debounce";
    import {
        mapActions, mapState
    } from "pinia";
    import isArray from "lodash/isArray";
    import { useUIStore } from "@/store/UI/UIStore";
    import ClassLink from "@/views/Character/Classes/ClassLink.vue";
    import ContentLayout from '@/components/content/ContentLayout.vue';
    import { useClassesStore } from '@/store/Character/ClassesStore';

    export default {
        name: 'ClassesView',
        components: {
            ClassLink,
            ContentLayout
        },
        async beforeRouteEnter(to, from, next) {
            const store = useClassesStore();

            await store.initFilter();
            await store.initClasses();

            next();
        },
        data: () => ({
            search: '',
            classesStore: useClassesStore()
        }),
        computed: {
            ...mapState(useUIStore, ['isMobile', 'fullscreen']),

            classes() {
                const classes = this.classesStore.classes || [];

                if (!classes?.length) {
                    return [];
                }

                const groups = sortBy(
                    Object.values(groupBy(
                        classes.filter(item => 'group' in item),
                        o => o.group.name
                    )).map(list => ({
                        group: list[0].group,
                        list: sortBy(list, [o => o.name.rus])
                    })),
                    [o => o.group.order]
                );

                const sorted = [
                    {
                        list: sortBy(classes.filter(item => !('group' in item)), [o => o.name.rus])
                    }
                ];

                if (isArray(groups) && groups.length) {
                    for (let i = 0; i < groups.length; i++) {
                        sorted.push(groups[i]);
                    }
                }

                return sorted;
            },

            showRightSide() {
                return this.$route.name === 'classDetail';
            }
        },
        beforeUnmount() {
            this.clearStore();
        },
        methods: {
            ...mapActions(useClassesStore, [
                'initFilter',
                'initClasses',
                'nextPage',
                'clearStore'
            ]),

            async classesQuery() {
                await this.initClasses();
            },

            // eslint-disable-next-line func-names
            onSearch: debounce(async function(e) {
                await this.classesQuery();

                this.search = e;
            }, 300)
        }
    };
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
