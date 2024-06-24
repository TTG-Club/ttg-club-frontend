<script lang="ts" setup>
  import { useRollStore } from '@/shared/stores/RollStore';
  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc.d';

  import PageLayout from '@/layouts/PageLayout.vue';

  import AbilityRaces from './ability-races/AbilityRaces.vue';
  import AbilityArray from './AbilityArray.vue';
  import AbilityPointBuy from './AbilityPointBuy.vue';
  import AbilityRandom from './AbilityRandom.vue';
  import AbilityTable from './AbilityTable.vue';

  enum Tabs {
    RANDOM,
    POINT_BY,
    STANDARD,
  }

  type TCalcTab = {
    label: string;
    value: Tabs;
  };

  const tabs: TCalcTab[] = [
    {
      label: 'Случайный набор',
      value: Tabs.RANDOM,
    },
    {
      label: '«Покупка» значений',
      value: Tabs.POINT_BY,
    },
    {
      label: 'Стандартный набор',
      value: Tabs.STANDARD,
    },
  ];

  const rolls = ref<Array<AbilityRoll>>([]);
  const raceBonuses = ref<Array<AbilityRoll>>([]);
  const currentTab = ref<TCalcTab['value']>(tabs[0].value);

  const rollStore = useRollStore();

  rollStore.setFallbackSource('Калькулятор характеристик');

  const TabComponent = computed(() => {
    switch (currentTab.value) {
      case Tabs.RANDOM:
        return h(AbilityRandom);

      case Tabs.POINT_BY:
        return h(AbilityPointBuy);

      case Tabs.STANDARD:
        return h(AbilityArray);

      default:
        return null;
    }
  });
</script>

<template>
  <page-layout
    show-separator
    class="ability-calc"
  >
    <template #title> Калькулятор характеристик </template>

    <template #default>
      <n-space
        vertical
        :size="40"
      >
        <ability-races v-model="raceBonuses" />

        <n-flex justify="center">
          <n-radio-group
            v-model:value="currentTab"
            size="large"
          >
            <n-radio-button
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
            >
              {{ tab.label }}
            </n-radio-button>
          </n-radio-group>
        </n-flex>

        <transition
          mode="out-in"
          name="fade"
        >
          <keep-alive>
            <tab-component v-model="rolls" />
          </keep-alive>
        </transition>

        <ability-table
          :race-bonuses="raceBonuses"
          :rolls="rolls"
        />
      </n-space>
    </template>
  </page-layout>
</template>
