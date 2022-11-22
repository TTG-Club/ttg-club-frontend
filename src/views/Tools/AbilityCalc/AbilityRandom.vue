<template>
    <div class="ability-random">
        <div class="ability-random__controls">
            <ui-button
                class="button"
                is-large
                @click.left.exact.prevent="tryRoll"
            >
                {{ rolls.length ? 'Перебросить' : 'Бросить кубики' }}
            </ui-button>

            <div
                v-if="rolls.length"
                class="ability-random__choose"
            >
                <ui-select
                    v-for="(roll, index) in rolls"
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

        <ability-table :rolls="rolls"/>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent, ref
    } from "vue";
    import { useToast } from "vue-toastification";
    import orderBy from 'lodash/orderBy';
    import reverse from 'lodash/reverse';
    import UiButton from "@/components/form/UiButton.vue";
    import AbilityTable from "@/views/Tools/AbilityCalc/AbilityTable.vue";
    import { useDiceRoller } from "@/common/composition/useDiceRoller";
    import { AbilityKey, AbilityName } from '@/enums/Tools/AbilityCalcEnum';
    import UiSelect from "@/components/form/UiSelect.vue";
    import { useAbilityTransforms } from "@/common/composition/useAbilityTransforms";
    import { ToastEventBus } from "@/common/utils/ToastConfig";

    export default defineComponent({
        components: {
            UiSelect,
            AbilityTable,
            UiButton
        },
        setup() {
            const toast = useToast(ToastEventBus);
            const { doRoll, notifyResult } = useDiceRoller();
            const { getFormattedModifier } = useAbilityTransforms();

            const rolls = ref<{
                name: AbilityName | null,
                key: AbilityKey | null,
                value: number
            }[]>([]);

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

                    rolls.value = reverse(orderBy(rolled, ['value']));
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
            };

            const onRemove = (index: number) => {
                rolls.value[index].key = null;
                rolls.value[index].name = null;
            };

            return {
                abilities: computed(() => Object
                    .keys(AbilityKey)
                    .map(key => ({
                        key,
                        name: AbilityName[key as AbilityKey]
                    }))),
                tryRoll,
                rolls,
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
        &__controls {
            display: flex;
            justify-content: center;
            width: 100%;
        }

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
