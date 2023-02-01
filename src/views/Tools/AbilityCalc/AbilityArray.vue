<template>
    <div
        v-if="modelValue.length"
        class="ability-array"
    >
        <ui-select
            v-for="(roll, index) in modelValue"
            :key="index"
            :model-value="roll"
            :options="abilities"
            allow-empty
            class="ability-array__select"
            label="name"
            track-by="key"
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
                    :class="{ 'is-selected': isSelected(option.key) }"
                    class="ability-array__select_option"
                >{{ option.name }}</span>
            </template>
        </ui-select>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, onActivated, ref
    } from 'vue';
    import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';
    import { AbilityKey, AbilityName } from '@/types/Tools/AbilityCalc.types';
    import UiSelect from '@/components/UI/kit/UiSelect.vue';
    import { useAbilityTransforms } from '@/common/composition/useAbilityTransforms';

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

            const rolls = ref<Array<AbilityRoll>>([
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 15
                },
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 14
                },
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 13
                },
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 12
                },
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 10
                },
                {
                    name: null,
                    key: null,
                    shortName: null,
                    value: 8
                }
            ]);

            emit('update:model-value', rolls.value);

            onActivated(() => {
                emit('update:model-value', rolls.value);
            });

            const isSelected = (key: AbilityKey) => rolls.value.find(roll => roll.key === key);

            const onSelect = (key: AbilityKey | null, index: number) => {
                const setValue = (value: typeof key, i: number) => {
                    rolls.value[i].key = value;

                    rolls.value[i].name = value
                        ? AbilityName[value]
                        : null;
                };

                for (let i = 0; i < rolls.value.length; i++) {
                    if (i === index) {
                        setValue(key, i);

                        continue;
                    }

                    if (rolls.value[i].key === key) {
                        setValue(null, i);
                    }
                }

                emit('update:model-value', rolls.value);
            };

            const onRemove = (index: number) => {
                rolls.value[index].key = null;
                rolls.value[index].name = null;

                emit('update:model-value', rolls.value);
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
                padding: 12px 12px 12px 28px;

                &.is-selected {
                    &::before {
                        content: "";
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: var(--primary);
                        position: absolute;
                        top: calc(50% - 5px);
                        left: 10px;
                    }
                }
            }

            &_roll {

            }
        }

        .ability-table {
            margin-top: 24px;
        }

        @media (max-width: 768px) {
            display: flex;
            flex-direction: column;
        }
    }
</style>
