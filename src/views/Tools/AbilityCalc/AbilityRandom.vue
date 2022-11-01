<template>
    <div class="ability-random">
        <div class="ability-random__row">
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
                        class="ability-random__choose_item"
                        label="name"
                        track-by="key"
                        :options="getFilteredOptions"
                        :model-value="roll.name"
                        @select="onSelect($event, index)"
                    >
                        <template #left-slot>
                            {{ roll.value }}
                        </template>

                        <template #placeholder>
                            Выбрать хар-ку
                        </template>
                    </ui-select>
                </div>
            </div>
        </div>

        <div class="ability-random__row">
            {{ abilities }}
        </div>

        <div class="ability-random__row">
            {{ rolls }}
        </div>

        <div class="ability-random__row">
            <ability-table :specifications="rolls"/>
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed,
        defineComponent, ref
    } from "vue";
    import { useToast } from "vue-toastification";
    import UiButton from "@/components/form/UiButton.vue";
    import AbilityTable from "@/views/Tools/AbilityCalc/AbilityTable.vue";
    import { useDiceRoller } from "@/common/composition/useDiceRoller";
    import { AbilityName, AbilityKey } from '@/views/Tools/AbilityCalc/AbilityEnum';
    import UiSelect from "@/components/form/UiSelect.vue";
    import { useAbilityTransforms } from "@/common/composition/useAbilityTransforms";

    export default defineComponent({
        components: {
            UiSelect,
            AbilityTable,
            UiButton
        },
        setup() {
            const { doRoll } = useDiceRoller();
            const { getFormattedModifier } = useAbilityTransforms();
            const toast = useToast();

            const abilities = ref<{
                name: AbilityName,
                key: AbilityKey,
            }[]>([

                {
                    name: AbilityName.STRENGTH,
                    key: AbilityKey.STRENGTH
                },
                {
                    name: AbilityName.DEXTERITY,
                    key: AbilityKey.DEXTERITY
                },
                {
                    name: AbilityName.CONSTITUTION,
                    key: AbilityKey.CONSTITUTION
                },
                {
                    name: AbilityName.INTELLIGENCE,
                    key: AbilityKey.INTELLIGENCE
                },
                {
                    name: AbilityName.WISDOM,
                    key: AbilityKey.WISDOM
                },
                {
                    name: AbilityName.CHARISMA,
                    key: AbilityKey.CHARISMA
                }
            ]);

            const rolls = ref<{
                name: AbilityName | null,
                key: AbilityKey | null,
                value: number
            }[]>([]);

            const tryRoll = () => {
                try {
                    rolls.value = [];

                    for (let i = 0; i < 6; i++) {
                        const roll = doRoll({
                            formula: '4d6kh3'
                        });

                        rolls.value.push({
                            name: null,
                            key: null,
                            value: Number(roll.value)
                        });
                    }
                } catch (err) {
                    toast.error('Произошла какая-то ошибка... попробуй еще раз');
                }
            };

            const getFilteredOptions = computed(() => abilities.value.filter(item => (
                !rolls.value.map(roll => roll.key).includes(item.key)
            )));

            const onSelect = (e: {name: AbilityName, key: AbilityKey}, index: number) => {
                rolls.value[index].name = e.name;
                rolls.value[index].key = e.key;
            };

            return {
                abilities,
                tryRoll,
                rolls,
                getFormattedModifier,
                getFilteredOptions,
                onSelect
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-random {
        &__row {
            & + & {
                margin-top: 40px;
            }
        }

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
            &_placeholder {
                display: flex;
            }

            &_roll {

            }
        }
    }
</style>
