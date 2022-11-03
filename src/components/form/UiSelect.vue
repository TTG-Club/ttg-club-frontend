<template>
    <div class="dnd5club-select">
        <div
            v-if="$slots['left-slot']"
            class="dnd5club-select__slot is-left"
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
    import SvgIcon from '@/components/UI/icons/SvgIcon';

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

<style lang="scss">
    .dnd5club-select {
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
