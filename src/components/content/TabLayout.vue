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
                <slot name="default"/>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        useInfiniteScroll, useResizeObserver
    } from "@vueuse/core";
    import FilterService from "@/common/services/FilterService";
    import ListFilter from "@/components/filter/ListFilter.vue";

    export default {
        name: 'TabLayout',
        components: { ListFilter },
        props: {
            filterInstance: {
                type: FilterService,
                default: undefined
            }
        },
        emits: [
            'list-end',
            'search',
            'update'
        ],
        data: () => ({
            dropdownHeight: 0,
            filterInstalled: false
        }),
        mounted() {
            useInfiniteScroll(
                this.$refs.items,
                () => {
                    this.$emit('list-end');
                },
                { distance: 1080 }
            );

            useResizeObserver(this.$refs.items, this.calcDropdownHeight);
        },
        methods: {
            calcDropdownHeight(entries) {
                const entry = entries[0];
                const { height } = entry.contentRect;

                this.dropdownHeight = height || 0;
            }
        }
    };
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
                padding: 24px;
            }
        }
    }
</style>
