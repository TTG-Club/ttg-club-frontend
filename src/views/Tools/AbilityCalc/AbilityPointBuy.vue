<template>
    <div class="ability-point-buy">
        <div class="ability-point-buy__body">
            <div class="ability-point-buy__blocks">
                <div class="ability-point-buy__block">
                    Очков: {{ 27 - sum }} / 27
                </div>

                <ui-button
                    class="ability-point-buy__block is-btn"
                    is-small
                    use-full-width
                    @click.left.exact.prevent="onReset"
                >
                    Сбросить
                </ui-button>
            </div>

            <div
                v-if="rolls.length"
                class="ability-point-buy__controls"
            >
                <ui-select
                    v-for="(roll, index) in rolls"
                    :key="index"
                    class="ability-point-buy__select"
                    label="value"
                    track-by="key"
                    :options="options"
                    :model-value="roll"
                    @select="roll.value = $event.key"
                >
                    <template #left-slot>
                        {{ String(roll.shortName).toUpperCase() }}
                    </template>

                    <template #singleLabel>
                        {{ roll.value || 'Выбрать значение' }}
                    </template>

                    <template #placeholder>
                        Выбрать значение
                    </template>

                    <template #option="{ option }">
                        {{ getLabel(roll, option) }}
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
    } from 'vue';
    import AbilityTable from '@/views/Tools/AbilityCalc/AbilityTable.vue';
    import {
        AbilityKey, AbilityName, AbilityShortName
    } from '@/enums/Tools/AbilityCalcEnum';
    import UiButton from '@/components/form/UiButton.vue';
    import UiSelect from '@/components/form/UiSelect.vue';
    import { usePluralize } from '@/common/composition/usePluralize';

    export default defineComponent({
        components: {
            UiSelect,
            UiButton,
            AbilityTable
        },
        setup() {
            const { getPlural } = usePluralize();

            const cost = [
                {
                    key: 8,
                    value: 0
                },
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
                shortName: AbilityShortName | null,
                name: AbilityName | null,
                key: AbilityKey | null,
                value: number
            }[]>([
                {
                    shortName: AbilityShortName.STRENGTH,
                    name: AbilityName.STRENGTH,
                    key: AbilityKey.STRENGTH,
                    value: 8
                },
                {
                    shortName: AbilityShortName.DEXTERITY,
                    name: AbilityName.DEXTERITY,
                    key: AbilityKey.DEXTERITY,
                    value: 8
                },
                {
                    shortName: AbilityShortName.CONSTITUTION,
                    name: AbilityName.CONSTITUTION,
                    key: AbilityKey.CONSTITUTION,
                    value: 8
                },
                {
                    shortName: AbilityShortName.INTELLIGENCE,
                    name: AbilityName.INTELLIGENCE,
                    key: AbilityKey.INTELLIGENCE,
                    value: 8
                },
                {
                    shortName: AbilityShortName.WISDOM,
                    name: AbilityName.WISDOM,
                    key: AbilityKey.WISDOM,
                    value: 8
                },
                {
                    shortName: AbilityShortName.CHARISMA,
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

            const options = computed(() => cost.filter(item => (sum.value + item.value <= 27)));

            const getLabel = (roll: typeof rolls.value[number], option: typeof cost[number]) => {
                let result = `${ option.key }`;

                const costItem = cost.find(item => item.key === roll.value);

                if (!costItem) {
                    return 'wtf?!';
                }

                const difference = costItem.value - option.value;
                const sign = Math.sign(difference) > -1 ? '+' : '-';

                const plural = getPlural(Math.abs(difference), [
                    'очко',
                    'очка',
                    'очков'
                ]);

                if (Math.abs(difference) > 0) {
                    result += ` (${ sign }${ Math.abs(difference) } ${ plural })`;
                }

                return result;
            };

            const onReset = () => {
                for (let i = 0; i < rolls.value.length; i++) {
                    rolls.value[i].value = 8;
                }
            };

            return {
                abilities: computed(() => Object
                    .keys(AbilityKey)
                    .map(key => ({
                        key,
                        name: AbilityName[key as AbilityKey]
                    }))),
                sum,
                rolls,
                options,
                getLabel,
                onReset
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-point-buy {
        &__body {
            display: flex;
            gap: 32px;
        }

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

        &__controls {
            flex: 1 1 auto;
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr 1fr;
        }

        &__select {
            &_placeholder {
                display: flex;
            }

            &_roll {

            }
        }

        .ability-table {
            margin-top: 40px;
        }
    }
</style>
