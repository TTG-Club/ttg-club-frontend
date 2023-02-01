<template>
    <div class="ability-random">
        <div class="ability-random__blocks">
            <div class="ability-random__block">
                Сумма: {{ sum }}
            </div>

            <ui-button
                class="ability-random__block is-btn"
                is-small
                use-full-width
                @click.left.exact.prevent="tryRoll"
            >
                {{ modelValue.length ? 'Перебросить' : 'Бросить кубики' }}
            </ui-button>
        </div>

        <div
            v-if="modelValue.length"
            class="ability-random__choose"
        >
            <ui-select
                v-for="(roll, index) in modelValue"
                :key="index"
                :model-value="roll"
                :options="abilities"
                allow-empty
                class="ability-random__select"
                label="name"
                track-by="key"
                @remove="onRemove(index)"
                @select="onSelect($event.key, index)"
            >
                <template #option="{ option }">
                    <span
                        :class="{ 'is-selected': isSelected(option.key) }"
                        class="ability-random__select_option"
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
    import type { PropType } from 'vue';
    import {
        computed, defineComponent, onActivated, ref
    } from 'vue';
    import { useToast } from 'vue-toastification';
    import orderBy from 'lodash/orderBy';
    import reverse from 'lodash/reverse';
    import { storeToRefs } from 'pinia';
    import UiButton from '@/components/UI/kit/UiButton.vue';
    import { useDiceRoller } from '@/common/composition/useDiceRoller';
    import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';
    import { AbilityKey, AbilityName } from '@/types/Tools/AbilityCalc.types';
    import UiSelect from '@/components/UI/kit/UiSelect.vue';
    import { useAbilityTransforms } from '@/common/composition/useAbilityTransforms';
    import { ToastEventBus } from '@/common/utils/ToastConfig';
    import { useUIStore } from '@/store/UI/UIStore';

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
            const uiStore = useUIStore();
            const { isMobile } = storeToRefs(uiStore);

            const {
                doRoll,
                notifyResult
            } = useDiceRoller();

            const { getFormattedModifier } = useAbilityTransforms();

            const rolls = ref<Array<AbilityRoll>>([]);

            emit('update:model-value', rolls.value);

            onActivated(() => {
                emit('update:model-value', rolls.value);
            });

            const tryRoll = () => {
                try {
                    const rolled = [];

                    for (let i = 0; i < 6; i++) {
                        const roll = doRoll({
                            formula: '4d6kh3'
                        });

                        if (!isMobile.value) {
                            notifyResult({
                                roll,
                                label: `Бросок №${ i + 1 }`,
                                toastOptions: {
                                    timeout: 5000 + 1000 * i
                                }
                            });
                        }

                        rolled.push({
                            name: null,
                            key: null,
                            shortName: null,
                            value: Number(roll.value)
                        });
                    }

                    rolls.value = reverse(orderBy(rolled, ['value']));

                    emit('update:model-value', rolls.value);
                } catch (err) {
                    toast.error('Произошла какая-то ошибка... попробуй еще раз');
                }
            };

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
                sum: computed(() => {
                    let result = 0;

                    for (const roll of rolls.value) {
                        if (roll.value) {
                            result += roll.value;
                        }
                    }

                    return result;
                }),
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

        &__blocks {
            min-width: 124px;
            gap: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            flex-shrink: 0;
        }

        &__block {
            flex: 1 1 auto;

            &:not(.is-btn) {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-table-list);
                border-radius: 6px;
                padding: 8px;
                color: var(--text-b-color);
                font-size: var(--main-font-size);
                line-height: calc(var(--main-line-height) - 1px);
            }
        }

        &__choose {
            flex: 1 1 auto;
            margin-left: 16px;
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr 1fr;

            @media (max-width: 768px) {
                margin-left: 0;
            }

            @media (max-width: 576px) {
                display: flex;
                flex-direction: column;
            }
        }

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
            flex-direction: column;
            gap: 16px;
        }
    }
</style>
