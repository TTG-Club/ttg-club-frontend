<template>
    <div class="ability-array">
        <div class="ability-array__row">
            <div class="ability-array__controls">
                <div
                    v-if="rolls.length"
                    class="ability-array__choose"
                >
                    <ui-select
                        v-for="(roll, index) in rolls"
                        :key="index"
                        class="ability-array__select"
                        label="name"
                        track-by="key"
                        :options="abilities"
                        :model-value="roll"
                        allow-empty
                        @remove="onRemove(index)"
                        @select="onSelect($event.key, index)"
                    >
                        <template #left-slot>
                            {{ roll.value }}
                        </template>

                        <template #option="{ option }">
                            <span
                                class="ability-array__select_option"
                                :class="{ 'is-selected': isSelected(option.key) }"
                            >{{ option.name }}</span>
                        </template>

                        <template #placeholder>
                            Выбрать хар-ку
                        </template>
                    </ui-select>
                </div>
            </div>
        </div>

        <div class="ability-array__row">
            <ability-table :rolls="rolls"/>
        </div>
    </div>
</template>

<script lang="ts">
    import {
        computed,
        defineComponent, ref
    } from "vue";
    import AbilityTable from "@/views/Tools/AbilityCalc/AbilityTable.vue";
    import { AbilityName, AbilityKey } from '@/views/Tools/AbilityCalc/AbilityEnum';
    import UiSelect from "@/components/form/UiSelect.vue";
    import { useAbilityTransforms } from "@/common/composition/useAbilityTransforms";
    import { useIsDev } from '@/common/helpers/isDev';

    export default defineComponent({
        components: {
            UiSelect,
            AbilityTable
        },
        setup() {
            const { getFormattedModifier } = useAbilityTransforms();

            const rolls = ref<{
                name: AbilityName | null,
                key: AbilityKey | null,
                value: number
            }[]>([
                {
                    name: null,
                    key: null,
                    value: 15
                },
                {
                    name: null,
                    key: null,
                    value: 14
                },
                {
                    name: null,
                    key: null,
                    value: 13
                },
                {
                    name: null,
                    key: null,
                    value: 12
                },
                {
                    name: null,
                    key: null,
                    value: 10
                },
                {
                    name: null,
                    key: null,
                    value: 8
                }
            ]);

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
                isDev: useIsDev(),
                abilities: computed(() => Object
                    .keys(AbilityKey)
                    .map(key => ({
                        key,
                        name: AbilityName[key as AbilityKey]
                    }))),
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
    .ability-array {
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
    }
</style>
