<template>
    <page-layout
        class="ability-calc"
        :use-social-links="false"
    >
        <template #title>
            Калькулятор характеристик
        </template>

        <template #default>
            <ability-races
                v-if="isDev"
                v-model="raceBonuses"
                class="ability-calc__row"
            />

            <ui-switch
                v-model="currentTab"
                :options="tabs"
                class="ability-calc__row"
                pre-select-first
                use-full-width
            />

            <transition
                name="fade"
                mode="out-in"
            >
                <component
                    :is="component"
                    v-if="!!component"
                    v-model="rolls"
                    class="ability-calc__row"
                />
            </transition>

            <ability-table
                class="ability-calc__row"
                :rolls="rolls"
                :race-bonuses="raceBonuses"
            />
        </template>
    </page-layout>
</template>

<script lang="ts">
    import type { Component } from "vue";
    import {
        computed, defineComponent, ref, shallowRef
    } from 'vue';
    import PageLayout from "@/components/content/PageLayout.vue";
    import UiSwitch from "@/components/form/UiSwitch.vue";
    import AbilityTable from "@/views/Tools/AbilityCalc/AbilityTable.vue";
    import AbilityRandom from "@/views/Tools/AbilityCalc/AbilityRandom.vue";
    import AbilityArray from '@/views/Tools/AbilityCalc/AbilityArray.vue';
    import AbilityPointBuy from '@/views/Tools/AbilityCalc/AbilityPointBuy.vue';
    import AbilityRaces from '@/views/Tools/AbilityCalc/AbilityRaces/AbilityRaces.vue';
    import { useIsDev } from '@/common/helpers/isDev';
    import type { AbilityRoll } from '@/types/Tools/AbilityCalc.types';

    type TCalcTab = {
        id: string
        name: string
        component: Component
    }

    export default defineComponent({
        components: {
            AbilityRaces,
            AbilityTable,
            PageLayout,
            UiSwitch
        },
        setup() {
            const tabs: TCalcTab[] = [
                {
                    id: 'random',
                    name: 'Случайный набор',
                    component: shallowRef(AbilityRandom)
                },
                {
                    id: 'point-buy',
                    name: '«Покупка» значений',
                    component: shallowRef(AbilityPointBuy)
                },
                {
                    id: 'standard',
                    name: 'Стандартный набор',
                    component: shallowRef(AbilityArray)
                }
            ];

            const raceBonuses = ref<Array<AbilityRoll>>([]);

            const currentTab = ref(tabs[0]);

            const rolls = ref<Array<AbilityRoll>>([]);

            const component = computed(() => currentTab.value?.component || null);

            return {
                tabs,
                currentTab,
                component,
                rolls,
                raceBonuses,
                isDev: useIsDev()
            };
        }
    });
</script>

<style lang="scss" scoped>
    .ability-calc {
        &__row {
            & + & {
                margin-top: 40px;
            }
        }
    }
</style>
