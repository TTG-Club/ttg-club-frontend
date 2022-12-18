<template>
    <div class="ability-random">
        <ui-button
            class="button"
            is-large
            @click.left.exact.prevent="tryRoll"
        >
            {{ modelValue.length ? 'Перебросить' : 'Бросить кубики' }}
        </ui-button>

        <div
            v-if="modelValue.length"
            class="ability-random__choose"
        >
            <ui-select
                v-for="(roll, index) in modelValue"
                :key="index"
                class="ability-random__select"
                label="name"
                track-by="key"
                :options="abilities"
                :model-value="roll"
                allow-empty
                @remove="onRemove(index)"
                @select="onSelect($event.key, index)"
            >
                <template #option="{ option }">
                    <span
                        class="ability-random__select_option"
                        :class="{ 'is-selected': isSelected(option.key) }"
                    >{{ option.name }}</span>
                </template>

                <template #left-slot>
                    {{ roll.value }}
                </template>

                <template #singleLabel>
                    {{ roll.name || 'Выбрать хар-ку' }}
                </template>

                <template #placeholder>
                    Выбрать хар-ку
                </template>
            </ui-select>
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent
    } from 'vue';
    import type {
        PropType
    } from 'vue';
    import { useToast } from "vue-toastification";
    import orderBy from 'lodash/orderBy';
    import reverse from 'lodash/reverse';
    import cloneDeep from 'lodash/cloneDeep';
    import UiButton from "@/components/form/UiButton.vue";
    import { useDiceRoller } from "@/common/composition/useDiceRoller";
    import {
        AbilityKey, AbilityName
    } from '@/types/Tools/AbilityCalc.types';
    import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';
    import UiSelect from "@/components/form/UiSelect.vue";
    import { useAbilityTransforms } from "@/common/composition/useAbilityTransforms";
    import { ToastEventBus } from "@/common/utils/ToastConfig";

    export default defineComponent({
        components: {
            UiSelect,
            UiButton
        },
        props: {
            modelValue: {
                type: Array as PropType<Array<AbilityRoll>>,
                required: true
            }
        },
        setup(props, { emit }) {
            const toast = useToast(ToastEventBus);
            const { doRoll, notifyResult } = useDiceRoller();
            const { getFormattedModifier } = useAbilityTransforms();

            emit('update:model-value', []);

            const tryRoll = () => {
                try {
                    const rolled = [];

                    for (let i = 0; i < 6; i++) {
                        const roll = doRoll({
                            formula: '4d6kh3'
                        });

                        notifyResult({
                            roll,
                            label: `Бросок №${ i + 1 }`,
                            toastOptions: {
                                timeout: 5000 + 1000 * i
                            }
                        });

                        rolled.push({
                            name: null,
                            key: null,
                            value: Number(roll.value)
                        });
                    }

                    emit('update:model-value', reverse(orderBy(rolled, ['value'])));
                } catch (err) {
                    toast.error('Произошла какая-то ошибка... попробуй еще раз');
                }
            };

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
                tryRoll,
                getFormattedModifier,
                isSelected,
                onSelect,
                onRemove
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-random {
        display: flex;
        justify-content: center;
        width: 100%;

        &__choose {
            flex: 1 1 auto;
            margin-left: 16px;
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr 1fr;
        }

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
