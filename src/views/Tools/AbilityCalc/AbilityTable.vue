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

        <div
            v-for="(ability, key) in abilities"
            :key="key"
            class="ability-table__col"
        >
            <div class="ability-table__row is-ability">
                {{ ability.shortName }}
            </div>

            <div class="ability-table__row is-value">
                <ui-button
                    v-if="useValueModifying && ability.value > 0"
                    class="ability-table__row--control is-left"
                    type="button"
                    is-small
                    is-icon
                    :disabled="ability.value <= 8"
                    @click.left.prevent.exact="$emit('decrement', ability.key)"
                >
                    <svg-icon
                        icon-name="minus"
                        :stroke-enable="false"
                        fill-enable
                    />
                </ui-button>

                <div class="ability-table__row--value">
                    {{ ability.value }}
                </div>

                <ui-button
                    v-if="useValueModifying && ability.value > 0"
                    class="ability-table__row--control is-right"
                    type="button"
                    is-small
                    is-icon
                    :disabled="disableValueIncrement || ability.value >= 15"
                    @click.left.prevent.exact="$emit('increment', ability.key)"
                >
                    <svg-icon
                        icon-name="plus"
                        :stroke-enable="false"
                        fill-enable
                    />
                </ui-button>
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
    import UiButton from '@/components/form/UiButton.vue';

    export default defineComponent({
        components: {
            UiButton,
            SvgIcon
        },
        props: {
            rolls: {
                type: Object as PropType<{
                    name: AbilityName | null,
                    key: AbilityKey | null,
                    value: number,
                    raceBonus?: number
                }[]>,
                required: true
            },
            useValueModifying: {
                type: Boolean,
                default: false
            },
            disableValueIncrement: {
                type: Boolean,
                default: false
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

            &.is-value {
                position: relative;
            }

            &--value {
                width: 100%;
                text-align: center;
            }

            &--control {
                @include css_anim();

                position: absolute;
                width: 24px;
                height: 24px;
                padding: 4px;

                &.is-left {
                    left: 0;
                    transform: translateX(-100%);
                }

                &.is-right {
                    right: 0;
                    transform: translateX(100%);
                }
            }
        }
    }
</style>
