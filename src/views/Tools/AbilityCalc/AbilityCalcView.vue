<template>
    <page-layout
        class="ability-calc"
        :use-social-links="false"
    >
        <template #title>
            Калькулятор характеристик
        </template>

        <template #default>
            <div
                v-if="isDev"
                class="ability-calc__row"
            >
                <ability-races/>
            </div>

            <div class="ability-calc__row">
                <ui-switch
                    v-model="currentTab"
                    :options="tabs"
                    class="ability-calc__tabs"
                    pre-select-first
                    use-full-width
                />
            </div>

            <div
                v-if="!!component"
                class="ability-calc__row"
            >
                <transition
                    name="fade"
                    mode="out-in"
                >
                    <component
                        :is="component"
                        v-if="component"
                    />
                </transition>
            </div>
        </template>
    </page-layout>
</template>

<script lang="ts">
    import type { Component } from "vue";
    import {
        computed, defineComponent, ref, shallowRef
    } from "vue";
    import PageLayout from "@/components/content/PageLayout.vue";
    import UiSwitch from "@/components/form/UiSwitch.vue";
    import AbilityTable from "@/views/Tools/AbilityCalc/AbilityTable.vue";
    import AbilityRandom from "@/views/Tools/AbilityCalc/AbilityRandom.vue";
    import AbilityArray from '@/views/Tools/AbilityCalc/AbilityArray.vue';
    import AbilityPointBuy from '@/views/Tools/AbilityCalc/AbilityPointBuy.vue';
    import AbilityRaces from '@/views/Tools/AbilityCalc/AbilityRaces.vue';
    import { useIsDev } from '@/common/helpers/isDev';

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

            const currentTab = ref({
                id: 'random',
                name: 'Случайный набор',
                component: shallowRef(AbilityRandom)
            });

            const component = computed(() => currentTab.value?.component || null);

            return {
                tabs,
                currentTab,
                component,
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
