<template>
    <div class="ui-select">
        <div
            v-if="$slots['left-slot']"
            class="ui-select__slot is-left"
        >
            <slot name="left-slot"/>
        </div>

        <multiselect
            v-bind="$props"
            @close="onClose"
            @open="onOpen"
            @remove="onRemove"
            @select="onSelect"
            @tag="onTag"
            @search-change="onSearch"
            @update:model-value="onUpdate"
        >
            <template #option="{ option, search }">
                <slot
                    :option="option"
                    :search="search"
                    name="option"
                />
            </template>
            <template #maxElements>
                <slot name="maxElements">
                    Ты выбрал максимальное количество
                </slot>
            </template>
            <template #noResult>
                <slot name="noResult">
                    Боги не знают ответа на твой запрос
                </slot>
            </template>
            <template #noOptions>
                <slot name="noOptions">
                    Не всегда есть выбор
                </slot>
            </template>
            <template #beforeList>
                <slot name="beforeList"/>
            </template>
            <template #afterList>
                <slot name="afterList"/>
            </template>
            <template #caret="{ toggle }">
                <slot
                    name="caret"
                    :toggle="toggle"
                >
                    <div
                        class="multiselect__select"
                        @mousedown.left.exact.prevent.stop="toggle()"
                    >
                        <svg-icon icon-name="arrow-stroke"/>
                    </div>
                </slot>
            </template>
            <template #singleLabel>
                <slot name="singleLabel"/>
            </template>
            <template #placeholder>
                <slot name="placeholder">
                    Выбери что-нибудь
                </slot>
            </template>
            <template #limit>
                <slot name="limit">
                    Ты выбрал слишком много
                </slot>
            </template>
            <template #clear="{ search }">
                <slot
                    :search="search"
                    name="clear"
                />
            </template>
            <template #tag="{ option, search, remove }">
                <slot
                    :option="option"
                    :remove="remove"
                    :search="search"
                    name="tag"
                />
            </template>
        </multiselect>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect';
    import { defineComponent } from "vue";
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: {
            Multiselect,
            SvgIcon
        },
        props: {
            modelValue: {
                type: [
                    Number,
                    String,
                    Object,
                    Array
                ],
                default: ''
            },
            name: {
                type: String,
                default: 'select'
            },
            options: {
                type: Array,
                required: true
            },
            multiple: {
                type: Boolean,
                default: false
            },
            label: {
                type: String,
                default: 'label'
            },
            inputLabel: {
                type: String,
                default: ''
            },
            placeholder: {
                type: String,
                default: ''
            },
            tagPlaceholder: {
                type: String,
                default: ''
            },
            searchable: {
                type: Boolean,
                default: false
            },
            taggable: {
                type: Boolean,
                default: false
            },
            preserveSearch: {
                type: Boolean,
                default: false
            },
            internalSearch: {
                type: Boolean,
                default: true
            },
            clearOnSelect: {
                type: Boolean,
                default: true
            },
            required: {
                type: Boolean,
                default: false
            },
            trackBy: {
                type: String,
                default: ''
            },
            optionsLimit: {
                type: Number,
                default: 1000
            },
            iconBlock: {
                type: String,
                default: ''
            },
            allowEmpty: {
                type: Boolean,
                default: false
            },
            groupValues: {
                type: String,
                default: ''
            },
            groupLabel: {
                type: String,
                default: ''
            },
            selectGroupLabel: {
                type: String,
                default: ''
            },
            selectLabel: {
                type: String,
                default: ''
            },
            selectedLabel: {
                type: String,
                default: ''
            },
            deselectLabel: {
                type: String,
                default: ''
            },
            deselectGroupLabel: {
                type: String,
                default: ''
            },
            groupSelect: {
                type: Boolean,
                default: false
            },
            preselectFirst: {
                type: Boolean,
                default: false
            }
        },
        emits: [
            'open',
            'search-change',
            'close',
            'select',
            'update:model-value',
            'remove',
            'tag'
        ],
        methods: {
            onUpdate(event) {
                this.$emit('update:model-value', event);
            },

            onSelect(event) {
                this.$emit('select', event);
            },

            onRemove(event) {
                this.$emit('remove', event);
            },

            onSearch(event) {
                this.$emit('search-change', event);
            },

            onTag(event) {
                this.$emit('tag', event);
            },

            onOpen(event) {
                this.$emit('open', event);
            },

            onClose(event) {
                this.$emit('close', event);
            }
        }
    });
</script>

<style lang="scss" scoped>
    :deep(.multiselect) {
        @include css_anim();

        box-sizing: border-box;
        outline: none;
        appearance: none;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: row-reverse;
        background: var(--bg-sub-menu);
        cursor: pointer;
        min-height: 38px;
        border: {
            width: 1px;
            style: solid;
            color: var(--border);
            radius: 8px;
        };

        .multiselect {
            &:after,
            &:before {
                box-sizing: border-box;
                outline: none;
                appearance: none;
                -webkit-overflow-scrolling: touch;
            }

            *,
            *:before,
            *:after {
                box-sizing: border-box;
                outline: none;
                appearance: none;
                -webkit-overflow-scrolling: touch;
            }

            &__tags {
                color: var(--text-color);
                font-size: var(--main-font-size);
                line-height: var(--main-line-height);
                background: transparent;
                min-height: 38px;
                width: 100%;
                padding: 0;
                border: 0;
            }

            &__select {
                @include css_anim();

                width: 38px;
                height: 100%;
                padding: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: static;
                flex-shrink: 0;
                top: initial;
                right: initial;

                &:hover {
                    background-color: var(--hover);
                }

                &:before {
                    display: none;
                }

                svg {
                    @include css_anim();

                    color: var(--primary);
                }
            }

            &__spinner {
                width: 38px;
                height: calc(100% - 2px);
                background: var(--bg-secondary);
                right: 0;

                &:before,
                &:after {
                    border-color: var(--primary) transparent transparent;
                }
            }

            &__input {
                cursor: text;
            }

            &__single,
            &__tags-wrap,
            &__placeholder {
                padding: 7px 12px 0 12px;
                min-height: 100%;
                width: 100%;
                margin: 0;
                border-radius: 0;
                background: transparent;
                color: var(--text-color);
                font-size: var(--main-font-size);
                line-height: var(--main-line-height);

                &::placeholder {
                    color: var(--text-color);
                    font-size: var(--main-font-size);
                    line-height: var(--main-line-height);
                }
            }

            &__content {
                width: 100%;

                &-wrapper {
                    background: var(--bg-secondary);
                    color: var(--text-color);
                    font-size: var(--main-font-size);
                    line-height: var(--main-line-height);
                    top: 100%;
                    left: -1px;
                    width: calc(100% + 2px);
                    border: {
                        width: 0 1px 1px 1px;
                        style: solid;
                        color: var(--border);
                        radius: 0 0 8px 8px;
                    };
                }
            }

            &__option {
                background: var(--bg-secondary);
                color: var(--text-color);
                width: 100%;

                span {
                    white-space: break-spaces;
                    width: 100%;
                    display: block;
                }

                &--group {
                    background: var(--bg-sub-menu);
                    color: var(--text-color);
                    font-weight: 600;
                }

                &--disabled {
                    background: var(--bg-sub-menu) !important;
                    color: var(--text-color) !important;
                }

                &--highlight {
                    background: var(--primary-hover);
                    color: var(--text-btn-color);

                    &:after {
                        background: transparent;
                    }
                }

                &--selected {
                    font-weight: 400;
                    color: var(--text-btn-color);
                    background: var(--primary-active);

                    &.multiselect {
                        &__option {
                            &--highlight {
                                color: var(--text-btn-color);
                                background: var(--primary-hover);
                            }
                        }
                    }
                }
            }

            &__element {
                width: 100%;
                margin-bottom: initial;
                line-height: initial;
            }

            &:hover,
            &:focus-within {
                @include css_anim();

                border-color: var(--primary-active);

                .multiselect {
                    &__content {
                        &-wrapper {
                            border-color: var(--primary-active);
                        }
                    }
                }
            }
        }
    }

    :deep(.multiselect--active) {
        border-radius: 8px 8px 0 0;

        .multiselect {
            &__placeholder {
                display: inline-block;
            }

            &__select {
                transform: none;

                svg {
                    transform: rotate(-180deg);
                }
            }
        }
    }

    .ui-select {
        display: flex;

        &__slot {
            padding: 8px;
            background-color: var(--bg-secondary);
            border-radius: 8px;
            color: var(--text-color);
            font-size: var(--main-font-size);
            line-height: var(--main-line-height);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            flex-shrink: 0;
            font-weight: 600;

            &.is-left {
                margin-right: 8px;
            }
        }
    }
</style>
