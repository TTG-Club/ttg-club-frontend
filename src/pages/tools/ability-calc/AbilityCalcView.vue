<script lang="ts" setup>
  import { useRollStore } from '@/shared/stores/RollStore';
  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc';

  import PageLayout from '@/layouts/PageLayout.vue';

  import AbilityArray from './AbilityArray.vue';
  import AbilityPointBuy from './AbilityPointBuy.vue';
  import AbilityRaces from './AbilityRaces.vue';
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

        <n-grid
          cols="1 672:3"
          x-gap="16"
          y-gap="16"
        >
          <n-grid-item
            v-for="tab in tabs"
            :key="tab.value"
          >
            <n-button
              block
              :type="currentTab !== tab.value ? 'default' : 'primary'"
              :secondary="currentTab !== tab.value"
              @click.left.exact.prevent="currentTab = tab.value"
            >
              {{ tab.label }}
            </n-button>
          </n-grid-item>
        </n-grid>

        <keep-alive>
          <tab-component v-model="rolls" />
        </keep-alive>

        <ability-table
          :race-bonuses="raceBonuses"
          :rolls="rolls"
        />
      </n-space>
    </template>
  </page-layout>
</template>
