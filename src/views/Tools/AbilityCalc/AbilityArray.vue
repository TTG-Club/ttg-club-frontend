<template>
    <div
        v-if="modelValue.length"
        class="ability-array"
    >
        <ui-select
            v-for="(roll, index) in modelValue"
            :key="index"
            class="ability-array__select"
            label="name"
            track-by="key"
            :options="abilities"
            :model-value="roll"
            allow-empty
            @remove="onRemove(index)"
            @select="onSelect($event.key, index)"
        >
            <template #left-slot>
                {{ roll.value }}
            </template>

            <template #singleLabel>
                {{ roll.name || 'Выбрать хар-ку' }}
            </template>

            <template #placeholder>
                Выбрать хар-ку
            </template>

            <template #option="{ option }">
                <span
                    class="ability-array__select_option"
                    :class="{ 'is-selected': isSelected(option.key) }"
                >{{ option.name }}</span>
            </template>
        </ui-select>
    </div>
</template>

<script lang="ts">
    import {
        computed,
        defineComponent
    } from 'vue';
    import type { PropType } from 'vue';
    import cloneDeep from 'lodash/cloneDeep';
    import { AbilityName, AbilityKey } from '@/types/Tools/AbilityCalc.types';
    import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';
    import UiSelect from "@/components/form/UiSelect.vue";
    import { useAbilityTransforms } from "@/common/composition/useAbilityTransforms";

    export default defineComponent({
        components: {
            UiSelect
        },
        props: {
            modelValue: {
                type: Array as PropType<Array<AbilityRoll>>,
                required: true
            }
        },
        setup(props, { emit }) {
            const { getFormattedModifier } = useAbilityTransforms();

            emit('update:model-value', [
                {
                    name: null,
                    key: null,
                    value: 15
                },
                {
                    name: null,
                    key: null,
                    value: 14
                },
                {
                    name: null,
                    key: null,
                    value: 13
                },
                {
                    name: null,
                    key: null,
                    value: 12
                },
                {
                    name: null,
                    key: null,
                    value: 10
                },
                {
                    name: null,
                    key: null,
                    value: 8
                }
            ]);

            const isSelected = (key: AbilityKey) => props.modelValue.find(roll => roll.key === key);

            const onSelect = (key: AbilityKey | null, index: number) => {
                const rolls = cloneDeep(props.modelValue);

                const setValue = (value: typeof key, i: number) => {
                    rolls[i].key = value;

                    rolls[i].name = value
                        ? AbilityName[value]
                        : null;
                };

                for (let i = 0; i < rolls.length; i++) {
                    if (i === index) {
                        setValue(key, i);

                        continue;
                    }

                    if (rolls[i].key === key) {
                        setValue(null, i);
                    }
                }

                emit('update:model-value', rolls);
            };

            const onRemove = (index: number) => {
                const rolls = cloneDeep(props.modelValue);

                rolls[index].key = null;
                rolls[index].name = null;

                emit('update:model-value', rolls);
            };

            return {
                abilities: computed(() => Object
                    .keys(AbilityKey)
                    .map(key => ({
                        key,
                        name: AbilityName[key as AbilityKey]
                    }))),
                getFormattedModifier,
                isSelected,
                onSelect,
                onRemove
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-array {
        flex: 1 1 auto;
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr 1fr 1fr;

        &__select {
            ::v-deep(.multiselect__option) {
                padding: 0;
            }

            &_placeholder {
                display: flex;
            }

            &_option {
                padding: 12px;

                &.is-selected {
                    background: var(--primary-select);
                    color: var(--text-b-color);
                }
            }

            &_roll {

            }
        }

        .ability-table {
            margin-top: 40px;
        }
    }
</style>
