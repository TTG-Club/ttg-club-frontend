<script setup lang="ts">
  import { computed, ref, shallowRef } from 'vue';

  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc.d';
  import UiSwitch from '@/shared/ui/kit/UiSwitch.vue';

  import PageLayout from '@/layouts/PageLayout.vue';

  import AbilityRaces from '@/pages/Tools/ability-calc/ability-races/AbilityRaces.vue';
  import AbilityArray from '@/pages/Tools/ability-calc/AbilityArray.vue';
  import AbilityPointBuy from '@/pages/Tools/ability-calc/AbilityPointBuy.vue';
  import AbilityRandom from '@/pages/Tools/ability-calc/AbilityRandom.vue';
  import AbilityTable from '@/pages/Tools/ability-calc/AbilityTable.vue';

  import type { Component } from 'vue';

  type TCalcTab = {
    id: string;
    name: string;
    component: Component;
  };

  const tabs: TCalcTab[] = [
    {
      id: 'random',
      name: 'Случайный набор',
      component: shallowRef(AbilityRandom),
    },
    {
      id: 'point-buy',
      name: '«Покупка» значений',
      component: shallowRef(AbilityPointBuy),
    },
    {
      id: 'standard',
      name: 'Стандартный набор',
      component: shallowRef(AbilityArray),
    },
  ];

  const raceBonuses = ref<Array<AbilityRoll>>([]);
  const currentTab = ref(tabs[0]);
  const rolls = ref<Array<AbilityRoll>>([]);

  const component = computed(() => currentTab.value?.component || null);
</script>

<template>
  <page-layout
    show-separator
    class="ability-calc"
  >
    <template #title> Калькулятор характеристик </template>

    <template #default>
      <ability-races
        v-model="raceBonuses"
        class="ability-calc__row"
      />

      <ui-switch
        v-model="currentTab"
        :options="tabs"
        class="ability-calc__row"
        pre-select-first
        full-width
      />

      <transition
        mode="out-in"
        name="fade"
      >
        <keep-alive v-if="!!component">
          <component
            :is="component"
            v-model="rolls"
            class="ability-calc__row"
          />
        </keep-alive>
      </transition>

      <ability-table
        :race-bonuses="raceBonuses"
        :rolls="rolls"
        class="ability-calc__row"
      />
    </template>
  </page-layout>
</template>

<style lang="scss" scoped>
  .ability-calc {
    &__row {
      & + & {
        margin-top: 40px;
      }
    }
  }
</style>
