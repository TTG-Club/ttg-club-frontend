<template>
    <div
        class="filter"
        :class="{ 'in-tab': inTab }"
    >
        <div class="filter__body">
            <div class="filter__search">
                <label class="filter__search_field">
                    <span class="filter__search_field_icon">
                        <svg-icon icon-name="search" />
                    </span>

                    <input
                        v-model.trim="search"
                        :autocomplete="false"
                        :spellcheck="false"
                        placeholder="Поиск..."
                        :maxlength="maxInputLength"
                        type="text"
                    >
                </label>

                <ui-erase-button
                    v-if="search"
                    @click="search = ''"
                />
            </div>

            <button
                v-if="filter"
                v-tippy="{ content: showed ? 'Скрыть фильтры' : 'Показать фильтры' }"
                :class="{ 'is-opened': showed }"
                class="filter__button"
                type="button"
                @click.left.exact.prevent="showed = !showed"
            >
                <svg-icon
                    :fill-enable="true"
                    :icon-name="isFilterCustomized ? 'filter-customized' : 'filter'"
                    :stroke-enable="false"
                />

                <span>Фильтр</span>
            </button>

            <button
                v-if="!!filter && isFilterCustomized"
                v-tippy="'Сбросить все фильтры'"
                class="filter__button"
                type="button"
                @click.left.exact.prevent="resetFilter"
            >
                <svg-icon icon-name="clear-filter" />
            </button>
        </div>

        <base-modal
            v-if="!!filter"
            v-model="showed"
        >
            <template #title>
                Фильтр
            </template>

            <template #default>
                <div class="filter__dropdown">
                    <div class="filter__dropdown_body">
                        <filter-item-sources
                            v-if="filter?.sources"
                            :model-value="filter.sources"
                            @update:model-value="setSourcesValue($event)"
                        />

                        <filter-item-checkboxes
                            v-for="(block, blockKey) in otherFiltered"
                            :key="blockKey"
                            :expand="block.expand"
                            :model-value="block.values"
                            :name="block.name"
                            :type="block.type || 'crumb'"
                            @update:model-value="setOtherValue($event, block.key)"
                        />
                    </div>
                </div>
            </template>

            <template #footer>
                <h5>
                    Фильтры применяются автоматически!
                </h5>
            </template>
        </base-modal>
    </div>
</template>

<script lang="ts">
    import cloneDeep from 'lodash/cloneDeep';
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, ref
    } from 'vue';
    import { useDebounceFn } from '@vueuse/core';
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';
    import FilterItemSources from '@/components/filter/FilterItem/FilterItemSources.vue';
    import FilterItemCheckboxes from '@/components/filter/FilterItem/FilterItemCheckboxes.vue';
    import errorHandler from '@/common/helpers/errorHandler';
    import BaseModal from '@/components/UI/modals/BaseModal.vue';
    import type {
        Filter, FilterComposable, FilterGroup, FilterItem
    } from '@/common/composition/useFilter';
    import UiEraseButton from "@/components/UI/kit/UiEraseButton.vue";

    export default defineComponent({

        components: {
            UiEraseButton,
            BaseModal,
            FilterItemCheckboxes,
            FilterItemSources,
            SvgIcon
        },
        props: {
            filterInstance: {
                type: Object as PropType<FilterComposable>,
                required: true
            },
            inTab: {
                type: Boolean,
                default: false
            },
            maxInputLength: {
                type: Number,
                default: 255
            }
        },
        setup(props, { emit }) {
            const showed = ref(false);

            const emitSearch = useDebounceFn(value => {
                emit('search', value);
            }, 500);

            const emitFilter = useDebounceFn(() => {
                emit('update');
            }, 500);

            const search = computed({
                get() {
                    return props.filterInstance.search.value.value;
                },
                set(value: string) {
                    emitSearch(props.filterInstance.search.updateSearch(value));
                }
            });

            const filter = computed<Filter | Array<FilterGroup> | undefined>({
                get: () => props.filterInstance.filter.value,
                set: async value => {
                    try {
                        if (!value) {
                            return;
                        }

                        await props.filterInstance.saveFilter(value);

                        emitFilter();
                    } catch (err) {
                        errorHandler(err);
                    }
                }
            });

            const otherFilters = computed({
                get(): Array<FilterGroup> {
                    if (Array.isArray(filter.value)) {
                        return filter.value;
                    }

                    return filter.value?.other || [];
                },

                set(value: Array<FilterGroup>) {
                    if (Array.isArray(filter.value)) {
                        filter.value = value;

                        return;
                    }

                    if (filter.value?.other) {
                        filter.value = {
                            ...filter.value,
                            other: value as Array<FilterGroup>
                        };
                    }
                }
            });

            const otherFiltered = computed(() => otherFilters.value.filter((group: FilterGroup) => !group.hidden));
            const isFilterCustomized = computed(() => props.filterInstance.isCustomized.value);

            const setSourcesValue = (value: Array<FilterGroup>) => {
                if (!filter.value || Array.isArray(filter.value)) {
                    return;
                }

                filter.value = {
                    ...filter.value,
                    sources: value
                };
            };

            const setOtherValue = (value: Array<FilterItem>, key: string) => {
                const otherFiltersCopy = cloneDeep(otherFilters.value);
                const index = otherFiltersCopy.findIndex(group => group.key === key);

                if (index > -1) {
                    otherFiltersCopy[index].values = value;

                    otherFilters.value = otherFiltersCopy;
                }
            };

            const resetFilter = async () => {
                await props.filterInstance.resetFilter();

                emitFilter();
            };

            return {
                showed,

                search,
                filter,
                otherFilters,
                otherFiltered,
                isFilterCustomized,

                setSourcesValue,
                setOtherValue,
                resetFilter
            };
        }
    });
</script>

<style lang="scss" scoped>
    .filter {
        position: relative;

        &__body {
            width: 100%;
            display: flex;
            position: relative;
            overflow: hidden;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 12px;
        }

        &__search {
            flex: 1;
            display: flex;

            &_field {
                flex: 1;
                display: flex;
                align-items: center;
                cursor: text;

                &_icon {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;

                    svg {
                        width: 24px;
                        height: 24px;
                        color: var(--primary);
                    }
                }

                input {
                    width: 100%;
                    height: 100%;
                    border: 0;
                    background-color: transparent;
                    color: var(--text-color);
                    padding: 0;
                }
            }
        }

        &__button {
            @include css_anim();

            display: flex;
            flex-shrink: 0;
            align-items: center;
            justify-content: center;
            padding: 8px;
            border-left: 1px solid var(--border);
            background-color: var(--primary);

            svg {
                @include css_anim();

                width: 24px;
                height: 24px;
                color: var(--text-btn-color);
            }

            span {
                @include css_anim();

                margin-left: 4px;
                color: var(--text-btn-color);
            }

            &.is-opened {
                @include css_anim();

                background-color: var(--primary-active);

                svg {
                    color: var(--text-btn-color);
                }

                span {
                    color: var(--text-btn-color);
                }
            }

            @include media-min($md) {
                &:hover {
                    @include css_anim();

                    background-color: var(--primary-hover);

                    svg {
                        color: var(--text-btn-color);
                    }

                    span {
                        color: var(--text-btn-color);
                    }
                }
            }
        }

        &__dropdown {
            width: 100%;

            &_body {
                padding: 16px;
            }
        }

        &.in-tab {
            padding: 0 16px;

            .filter {
                &__body {
                    border-radius: 8px;
                    background-color: var(--bg-sub-menu);
                }
            }

            @include media-min($xl) {
                padding: 0 24px;
            }
        }
    }
</style>
