<template>
    <div class="ability-table">
        <div class="ability-table__col is-aside">
            <div class="ability-table__row is-aside">
                Хар-ка
            </div>

            <div class="ability-table__row is-aside">
                Значение
            </div>

            <div class="ability-table__row is-aside">
                Бон. расы
            </div>

            <div class="ability-table__row is-aside">
                Модиф.
            </div>

            <div class="ability-table__row is-aside">
                Итого
            </div>
        </div>

        <div class="ability-table__body">
            <div
                v-for="(ability, key) in abilities"
                :key="key"
                class="ability-table__col"
            >
                <div class="ability-table__row is-ability">
                    {{ ability.shortName }}
                </div>

                <div class="ability-table__row">
                    {{ ability.value }}
                </div>

                <div class="ability-table__row">
                    {{ ability.raceBonus }}
                </div>

                <div class="ability-table__row">
                    {{ ability.modifier }}
                </div>

                <div class="ability-table__row">
                    {{ ability.result }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import {
        computed,
        defineComponent
    } from 'vue';
    import {
        AbilityName, AbilityKey, AbilityShortName
    } from '@/views/Tools/AbilityCalc/AbilityEnum';
    import { useAbilityTransforms } from '@/common/composition/useAbilityTransforms';

    export default defineComponent({
        props: {
            rolls: {
                type: Object as PropType<{
                    name: AbilityName | null,
                    key: AbilityKey | null,
                    value: number,
                    raceBonus?: number
                }[]>,
                required: true
            }
        },
        setup(props) {
            const { getFormattedModifier } = useAbilityTransforms();

            const abilities = computed(() => Object.values(AbilityKey)
                .map((key: AbilityKey) => {
                    const roll = props.rolls.find(item => item.key === key);

                    const getValue = () => {
                        if (typeof roll?.value !== 'number') {
                            return '-';
                        }

                        return roll.value;
                    };

                    const getModifier = () => {
                        if (typeof roll?.value !== 'number') {
                            return '-';
                        }

                        return getFormattedModifier(roll.value);
                    };

                    const getRaceBonus = () => {
                        if (typeof roll?.raceBonus !== 'number') {
                            return '-';
                        }

                        return roll.raceBonus;
                    };

                    const getResult = () => {
                        let result = 0;

                        if (typeof roll?.value === 'number') {
                            result += roll.value;
                        }

                        if (typeof roll?.raceBonus === 'number') {
                            result += roll.raceBonus;
                        }

                        return result;
                    };

                    return {
                        key,
                        name: AbilityName[key],
                        shortName: AbilityShortName[key],
                        value: getValue(),
                        modifier: getModifier(),
                        raceBonus: getRaceBonus(),
                        result: getResult()
                    };
                }));

            return {
                AbilityKey,
                AbilityShortName,

                abilities
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-table {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 4fr;
        gap: 12px;
        cursor: default;

        @include media-max($xl) {
            display: flex;
        }

        &__body {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(6, 1fr);

            @include media-max($xl) {
                grid-template-columns: initial;
                display: flex;
                flex: 1 1 auto;
                overflow: auto;
            }
        }

        &__col {
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow: hidden;
            border-radius: 6px;
            padding: 12px 0;

            @include media-max($xl) {
                width: 112px;
            }

            &.is-aside {
                flex-shrink: 0;
            }

            &:not(.is-aside) {
                padding: 12px 24px;
                align-items: center;
                background-color: var(--bg-table-row);

                @include media-max($xl) {
                    width: 86px;
                }
            }
        }

        &__row {
            font-size: 20px;
            line-height: 27px;
            color: var(--text-b-color);
            width: 100%;
            display: flex;
            align-items: center;

            &:not(.is-aside) {
                justify-content: center;
            }

            &.is-ability {
                text-transform: uppercase;
            }
        }
    }
</style>
