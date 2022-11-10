<template>
    <div class="ability-point-buy">
        <div class="ability-point-buy__row">
            <div class="ability-point-buy__blocks">
                <div class="ability-point-buy__block">
                    Всего: 27
                </div>

                <div class="ability-point-buy__block">
                    Осталось: {{ 27 - sum }}
                </div>

                <ui-button
                    is-small
                    @click.left.exact.prevent="onReset"
                >
                    Сбросить
                </ui-button>
            </div>
        </div>

        <div class="ability-point-buy__row">
            <ability-table
                :rolls="rolls"
                :disable-value-increment="sum >= 27"
                use-value-modifying
                @increment="onIncrement"
                @decrement="onDecrement"
            />
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed, defineComponent, ref
    } from 'vue';
    import AbilityTable from '@/views/Tools/AbilityCalc/AbilityTable.vue';
    import { AbilityKey, AbilityName } from '@/views/Tools/AbilityCalc/AbilityEnum';
    import { useIsDev } from '@/common/helpers/isDev';
    import UiButton from '@/components/form/UiButton.vue';

    export default defineComponent({
        components: {
            UiButton,
            AbilityTable
        },
        setup() {
            const cost = [
                {
                    key: 9,
                    value: 1
                },
                {
                    key: 10,
                    value: 2
                },
                {
                    key: 11,
                    value: 3
                },
                {
                    key: 12,
                    value: 4
                },
                {
                    key: 13,
                    value: 5
                },
                {
                    key: 14,
                    value: 7
                },
                {
                    key: 15,
                    value: 9
                }
            ];

            const rolls = ref<{
                name: AbilityName | null,
                key: AbilityKey | null,
                value: number
            }[]>([
                {
                    name: AbilityName.STRENGTH,
                    key: AbilityKey.STRENGTH,
                    value: 8
                },
                {
                    name: AbilityName.DEXTERITY,
                    key: AbilityKey.DEXTERITY,
                    value: 8
                },
                {
                    name: AbilityName.CONSTITUTION,
                    key: AbilityKey.CONSTITUTION,
                    value: 8
                },
                {
                    name: AbilityName.INTELLIGENCE,
                    key: AbilityKey.INTELLIGENCE,
                    value: 8
                },
                {
                    name: AbilityName.WISDOM,
                    key: AbilityKey.WISDOM,
                    value: 8
                },
                {
                    name: AbilityName.CHARISMA,
                    key: AbilityKey.CHARISMA,
                    value: 8
                }
            ]);

            const sum = computed(() => rolls.value
                .reduce((partialSum, roll) => {
                    const costItem = cost.find(item => item.key === roll.value);

                    if (!costItem) {
                        return partialSum;
                    }

                    return partialSum + costItem.value;
                }, 0));

            const onIncrement = (key: AbilityKey) => {
                const index = rolls.value.findIndex(roll => roll.key === key);

                if (index < 0) {
                    return;
                }

                rolls.value[index].value++;
            };

            const onDecrement = (key: AbilityKey) => {
                const index = rolls.value.findIndex(roll => roll.key === key);

                if (index < 0) {
                    return;
                }

                rolls.value[index].value--;
            };

            const onReset = () => {
                for (let i = 0; i < rolls.value.length; i++) {
                    rolls.value[i].value = 8;
                }
            };

            return {
                isDev: useIsDev(),
                abilities: computed(() => Object
                    .keys(AbilityKey)
                    .map(key => ({
                        key,
                        name: AbilityName[key as AbilityKey]
                    }))),
                sum,
                rolls,
                onIncrement,
                onDecrement,
                onReset
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-point-buy {
        &__row {
            & + & {
                margin-top: 40px;
            }
        }

        &__blocks {
            gap: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        &__block {
            background: var(--bg-table-list);
            border-radius: 6px;
            padding: 8px;
            color: var(--text-b-color);
            font-size: var(--main-font-size);
            line-height: calc(var(--main-line-height) - 1px);
        }
    }
</style>
