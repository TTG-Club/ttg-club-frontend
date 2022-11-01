<template>
    <div class="filter">
        <div
            :class="{ 'in-tab': inTab }"
            class="filter__body"
        >
            <div class="filter__search">
                <label class="filter__search_field">
                    <span class="filter__search_field_icon">
                        <svg-icon icon-name="search"/>
                    </span>

                    <input
                        v-model.trim="search"
                        :autocomplete="false"
                        :spellcheck="false"
                        placeholder="Поиск..."
                        type="text"
                    >
                </label>

                <button
                    v-if="!!search"
                    v-tippy="{ content: 'Стереть строку поиска' }"
                    class="filter__search_clear"
                    type="button"
                    @click.left.exact.prevent="search = ''"
                >
                    <svg-icon icon-name="close"/>
                </button>
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
                <svg-icon icon-name="clear-filter"/>
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
                            :model-value="block.values"
                            :name="block.name"
                            :expand="block.expand"
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

<script>
    import cloneDeep from "lodash/cloneDeep";
    import debounce from "lodash/debounce";
    import SvgIcon from '@/components/UI/icons/SvgIcon';
    import FilterItemSources from '@/components/filter/FilterItem/FilterItemSources';
    import FilterItemCheckboxes from '@/components/filter/FilterItem/FilterItemCheckboxes';
    import FilterService from "@/common/services/FilterService";
    import errorHandler from "@/common/helpers/errorHandler";
    import BaseModal from "@/components/UI/modals/BaseModal";

    export default {
        name: 'ListFilter',
        components: {
            BaseModal,
            FilterItemCheckboxes,
            FilterItemSources,
            SvgIcon
        },
        props: {
            filterInstance: {
                type: FilterService,
                default: undefined,
                required: true
            },
            inTab: {
                type: Boolean,
                default: false
            },
            exactSearch: {
                type: Boolean,
                default: false
            }
        },
        emits: [
            'clear-filter',
            'search',
            'update'
        ],
        data: () => ({
            showed: false
        }),
        computed: {
            search: {
                get() {
                    return this.filterInstance?.getSearchState || '';
                },

                async set(value) {
                    try {
                        await this.filterInstance.updateSearch(value);

                        this.emitSearch(value);
                    } catch (err) {
                        errorHandler(err);
                    }
                }
            },

            filter: {
                get() {
                    return this.filterInstance?.getFilterState || undefined;
                },

                async set(value) {
                    try {
                        await this.filterInstance.save(value);

                        this.emitFilter();
                    } catch (err) {
                        errorHandler(err);
                    }
                }
            },

            otherFiltered() {
                return this.otherFilters.filter(filter => !filter.hidden);
            },

            otherFilters: {
                get() {
                    return this.filter?.other || this.filter || [];
                },

                set(value) {
                    if (this.filter?.other) {
                        this.filter = {
                            ...this.filter,
                            other: value
                        };

                        return;
                    }

                    this.filter = value;
                }
            },

            isFilterCustomized() {
                return this.filterInstance.isCustomized;
            }
        },
        beforeUnmount() {
            this.cancelEmits();
        },
        methods: {
            setSourcesValue(value) {
                this.filter = {
                    ...this.filter,
                    sources: value
                };
            },

            setOtherValue(value, key) {
                const otherFilters = cloneDeep(this.otherFilters);
                const index = otherFilters.findIndex(filter => filter.key === key);

                if (index > -1) {
                    otherFilters[index].values = value;

                    this.otherFilters = otherFilters;
                }
            },

            async resetFilter() {
                await this.filterInstance.reset();

                this.emitFilter();
            },

            // eslint-disable-next-line func-names
            emitSearch: debounce(function(value) {
                this.$emit('search', value);
            }, 500),

            // eslint-disable-next-line func-names
            emitFilter: debounce(function() {
                this.$emit('update');
            }, 500),

            cancelEmits() {
                if (typeof this.emitSearch?.cancel === "function") {
                    this.emitSearch.cancel();
                }

                if (typeof this.emitFilter?.cancel === "function") {
                    this.emitFilter.cancel();
                }
            }
        }
    };
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

            &.in-tab {
                border: {
                    radius: 0;
                    left: 0;
                    top: 0;
                    right: 0;
                }
            }
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

            &_clear {
                @include css_anim();

                display: flex;
                align-items: center;
                justify-content: center;
                width: 42px;
                height: 42px;
                flex-shrink: 0;
                color: var(--primary);

                @include media-min($md) {
                    &:hover {
                        color: var(--text-btn-color);
                        background-color: var(--primary-hover);
                    }
                }

                svg {
                    width: 16px;
                    height: 16px;
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

            svg {
                @include css_anim();

                width: 24px;
                height: 24px;
                color: var(--primary);
            }

            span {
                @include css_anim();

                margin-left: 4px;
                color: var(--text-color);
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
    }
</style>
