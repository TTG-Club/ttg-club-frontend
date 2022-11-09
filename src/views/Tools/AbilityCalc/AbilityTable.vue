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

            <div class="ability-table__row is-value">
                <button
                    v-if="useValueModifying && ability.value > 0"
                    type="button"
                    class="ability-table__row--control is-left"
                >
                    <svg-icon
                        icon-name="minus"
                        :stroke-enable="false"
                        fill-enable
                    />
                </button>

                <div class="ability-table__row--value">
                    {{ ability.value }}
                </div>

                <button
                    v-if="useValueModifying && ability.value > 0"
                    type="button"
                    class="ability-table__row--control is-right"
                >
                    <svg-icon
                        icon-name="plus"
                        :stroke-enable="false"
                        fill-enable
                    />
                </button>
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
    import SvgIcon from '@/components/UI/icons/SvgIcon.vue';

    export default defineComponent({
        components: {
            SvgIcon
        },
        props: {
            rolls: {
                type: Object as PropType<{
                    name: AbilityName | null,
                    key: AbilityKey | null,
                    value: number
                }[]>,
                required: true
            },
            useValueModifying: {
                type: Boolean,
                default: false
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
        cursor: default;

        &__col {
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow: hidden;
            border-radius: 6px;
            padding: 12px 0;

            &:not(.is-aside) {
                padding: 12px 24px;
                align-items: center;
                background-color: var(--bg-table-row);
            }
        }

        &__row {
            font-size: var(--h4-font-size);
            line-height: var(--h4-line-height);
            color: var(--text-b-color);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;

            &.is-ability {
                text-transform: uppercase;
            }

            &.is-value {
                position: relative;
                display: flex;
                align-items: center;
            }

            &--value {
                width: 100%;
            }

            &--control {
                @include css_anim();

                position: absolute;
                width: 24px;
                height: 24px;
                background-color: var(--primary);
                color: var(--text-btn-color);
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;

                &.is-left {
                    left: 0;
                    transform: translateX(-100%);
                }

                &.is-right {
                    right: 0;
                    transform: translateX(100%);
                }

                &:hover {
                    background-color: var(--primary-hover);
                }

                &:active {
                    background-color: var(--primary-active);
                }
            }
        }
    }
</style>
