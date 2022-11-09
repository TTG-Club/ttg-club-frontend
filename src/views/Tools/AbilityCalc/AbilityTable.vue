<template>
    <div class="ability-table">
        <div class="ability-table__col is-aside">
            <div class="ability-table__row">
                Хар-ка
            </div>

            <div class="ability-table__row">
                Значение
            </div>

            <div class="ability-table__row">
                Бон. расы
            </div>

            <div class="ability-table__row">
                Модиф.
            </div>

            <div class="ability-table__row">
                Итого
            </div>
        </div>

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
                0
            </div>

            <div class="ability-table__row">
                {{ ability.modifier }}
            </div>

            <div class="ability-table__row">
                {{ ability.result }}
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
                    value: number
                }[]>,
                required: true
            }
        },
        setup(props) {
            const { getFormattedModifier } = useAbilityTransforms();

            const abilities = computed({
                get: () => Object.values(AbilityKey)
                    .map((key: AbilityKey) => {
                        const value = props.rolls.find(roll => roll.key === key)?.value || '-';

                        const modifier = typeof value === 'number'
                            ? getFormattedModifier(value)
                            : '-';

                        const obj = {
                            key,
                            modifier,
                            value,
                            name: AbilityName[key],
                            shortName: AbilityShortName[key],
                            raceBonus: 0
                        };

                        return {
                            ...obj,
                            result: computed(() => (
                                typeof obj.value === 'number'
                                    ? obj.value + obj.raceBonus
                                    : obj.raceBonus
                            ))
                        };
                    }),
                set: v => {
                    console.log(v);
                }
            });

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
        display: grid;
        grid-template-columns: 2fr repeat(6, 1fr);
        gap: 24px;

        &__col {
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow: hidden;
            border-radius: 6px;
            padding: 12px 0;

            &:not(.is-aside) {
                padding: 12px 22px;
                align-items: center;
                background-color: var(--bg-table-row);
            }
        }

        &__row {
            font-size: var(--h4-font-size);
            line-height: var(--h4-line-height);
            color: var(--text-b-color);

            &.is-ability {
                text-transform: uppercase;
            }
        }
    }
</style>
