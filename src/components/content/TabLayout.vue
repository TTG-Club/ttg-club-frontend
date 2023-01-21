<template>
    <div
        ref="layout"
        class="tab-layout"
    >
        <div
            v-if="filterInstance"
            ref="filter"
            class="tab-layout__filter"
        >
            <div class="tab-layout__filter_body">
                <list-filter
                    :filter-instance="filterInstance"
                    :in-tab="true"
                    @search="$emit('search', $event)"
                    @update="$emit('update', $event)"
                />
            </div>

            <div
                :style="{ height: `${dropdownHeight}px` }"
                class="tab-layout__filter_dropdown"
                data-tab-filter
            />
        </div>

        <div
            ref="items"
            class="tab-layout__items"
        >
            <div class="tab-layout__items--inner">
                <slot name="default" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { useInfiniteScroll, useResizeObserver } from '@vueuse/core';
    import type { PropType } from 'vue';
    import {
        defineComponent, onMounted, ref
    } from 'vue';
    import ListFilter from '@/components/filter/ListFilter.vue';
    import type { FilterComposable } from '@/common/composition/useFilter';

    export default defineComponent({

        components: { ListFilter },
        props: {
            filterInstance: {
                type: Object as PropType<FilterComposable>,
                default: undefined
            }
        },
        setup(props, { emit }) {
            const dropdownHeight = ref(0);

            const items = ref<HTMLDivElement | null>(null);

            onMounted(() => {
                useInfiniteScroll(
                    items,
                    () => {
                        emit('list-end');
                    },
                    { distance: 1080 }
                );

                useResizeObserver(items, entries => {
                    if (Array.isArray(entries) && entries.length) {
                        const entry = entries[0];
                        const { height } = entry.contentRect;

                        dropdownHeight.value = height || 0;
                    }
                });
            });

            return {
                dropdownHeight,
                items
            };
        }
    });
</script>

<style lang="scss" scoped>
    .tab-layout {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        &__filter {
            flex-shrink: 0;
            position: relative;
            padding-bottom: 8px;

            &_dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;

                ::v-deep(*) {
                    pointer-events: auto;
                }
            }
        }

        &__items {
            flex: 1 1 100%;
            overflow: auto;

            &--inner {
                padding: 8px 16px 16px;

                @include media-min($xl) {
                    padding: 8px 24px 24px;
                }
            }
        }
    }
</style>
