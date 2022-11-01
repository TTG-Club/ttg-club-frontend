<template>
    <div class="ability-table">
        <table
            v-for="(block, key) in specifications"
            :key="key"
            class="ability-table__block"
        >
            <thead class="ability-table__head">
                <tr>
                    <td class="ability-table__name">
                        {{ block.name }}
                    </td>

                    <td class="ability-table__value">
                        <svg-icon/>
                    </td>
                </tr>
            </thead>

            <tbody class="ability-table__body">
                <tr class="ability-table__row">
                    <td class="ability-table__name">
                        Характеристика
                    </td>

                    <td class="ability-table__value">
                        {{ block.value }}
                    </td>
                </tr>

                <tr class="ability-table__row">
                    <td class="ability-table__name">
                        Значение
                    </td>

                    <td class="ability-table__value">
                        {{ block.value }}
                    </td>
                </tr>

                <tr class="ability-table__row">
                    <td class="ability-table__name">
                        Бонус от расы
                    </td>

                    <td class="ability-table__value">
                        {{ block.value }}
                    </td>
                </tr>

                <tr class="ability-table__row">
                    <td class="ability-table__name">
                        Модификатор
                    </td>

                    <td class="ability-table__value">
                        {{ block.value }}
                    </td>
                </tr>

                <tr class="ability-table__row">
                    <td class="ability-table__name">
                        Итого
                    </td>

                    <td class="ability-table__value">
                        {{ block.value }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
    import type { PropType } from 'vue';
    import { defineComponent } from "vue";
    import type { AbilityName, AbilityKey } from "@/views/Tools/AbilityCalc/AbilityEnum";

    export default defineComponent({
        props: {
            specifications: {
                type: Object as PropType<{
                    name: AbilityName | null,
                    key: AbilityKey | null,
                    value: number
                }[]>,
                required: true
            }
        }
    });
</script>

<style lang="scss" scoped>
    .ability-table {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 24px;

        &__block {
            overflow: hidden;
            border-radius: 8px;
            background-color: var(--bg-main);
            border: 1px solid var(--border);
            border-collapse: collapse;
        }

        &__body {
        }

        &__row {
            & + & {
                border-top: 1px solid var(--border);
            }
        }

        &__name,
        &__value {
        }

        &__value {
            width: 70px;
            font-weight: 600;
            font-size: var(--h4-font-size);
        }
    }
</style>
