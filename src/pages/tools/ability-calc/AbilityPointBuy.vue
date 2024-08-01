<script setup lang="ts">
  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import {
    AbilityKey,
    AbilityName,
    type AbilityRoll,
    AbilityShortName,
    POINT_BUY_COST,
  } from '@/shared/types/tools/AbilityCalc';
  import { getPlural } from '@/shared/utils/string';

  import type { SelectOption } from 'naive-ui';

  const MAX_POINT_SUM = 27;

  const { smallerOrEqual } = useAppBreakpoints();

  const isLg = smallerOrEqual('lg');

  const model = defineModel<Array<AbilityRoll>>({ default: () => [] });

  const rolls = ref<Array<AbilityRoll>>(
    Object.values(AbilityKey).map((key) => ({
      key,
      value: 8,
      name: AbilityName[key],
      shortName: AbilityShortName[key],
    })),
  );

  model.value = rolls.value;

  onActivated(() => {
    model.value = rolls.value;
  });

  const sum = computed(() =>
    rolls.value.reduce((partialSum, roll) => {
      const index = POINT_BUY_COST.findIndex(
        (cost) => cost.value === roll.value,
      );

      const value = POINT_BUY_COST[index];

      return partialSum + value.cost;
    }, 0),
  );

  const getLabel = (
    roll: (typeof rolls.value)[number],
    option: (typeof POINT_BUY_COST)[number],
  ) => {
    let result = `${option.value}`;

    const index = POINT_BUY_COST.findIndex((cost) => cost.value === roll.value);
    const value = POINT_BUY_COST[index];

    const difference = value.cost - option.cost;
    const sign = Math.sign(difference) > -1 ? '+' : '-';

    const plural = getPlural(Math.abs(difference), ['очко', 'очка', 'очков']);

    if (Math.abs(difference) > 0) {
      result += ` (${sign}${Math.abs(difference)} ${plural})`;
    }

    return result;
  };

  const options = computed(() => (roll: AbilityRoll): Array<SelectOption> => {
    const index = POINT_BUY_COST.findIndex((cost) => cost.value === roll.value);
    const value = POINT_BUY_COST[index];

    return POINT_BUY_COST.map((item) => ({
      key: item.value,
      value: item.value,
      disabled: !(sum.value + item.cost - value.cost <= MAX_POINT_SUM),
      label: getLabel(roll, item),
    }));
  });

  const onSelect = (value: number | null, key: AbilityKey) => {
    if (!value) {
      return;
    }

    const index = rolls.value.findIndex((roll) => roll.key === key);

    rolls.value[index].value = value;
  };

  const onReset = () => {
    for (let i = 0; i < rolls.value.length; i++) {
      rolls.value[i].value = 8;
    }

    model.value = rolls.value;
  };
</script>

<template>
  <n-flex
    :wrap="false"
    :vertical="isLg"
    :size="16"
  >
    <n-flex
      justify="space-between"
      vertical
      :size="16"
    >
      <div :class="$style.sum">
        Очков: {{ MAX_POINT_SUM - sum }} / {{ MAX_POINT_SUM }}
      </div>

      <n-button
        block
        type="primary"
        @click.left.exact.prevent="onReset"
      >
        Сбросить
      </n-button>
    </n-flex>

    <n-grid
      cols="1 672:3"
      x-gap="16"
      y-gap="16"
    >
      <n-grid-item
        v-for="roll in rolls"
        :key="roll.key"
      >
        <n-input-group>
          <transition
            name="fade"
            mode="out-in"
            appear
          >
            <n-input-group-label
              :style="{ width: '56px', textAlign: 'center' }"
            >
              {{ roll.shortName.toUpperCase() }}
            </n-input-group-label>
          </transition>

          <n-select
            :value="roll.value"
            :options="options(roll)"
            :show-checkmark="false"
            placeholder="Выбрать значение"
            @update:value="onSelect($event, roll.key)"
          />
        </n-input-group>
      </n-grid-item>
    </n-grid>
  </n-flex>
</template>

<style module lang="scss">
  .sum {
    width: 100%;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    background: var(--bg-table-list);
    border-radius: 8px;
    padding: 0 8px;
    color: var(--text-b-color);
    font-size: var(--main-font-size);
    line-height: calc(var(--main-line-height) - 1px);
  }

  .dotted {
    flex-direction: row-reverse;
    justify-content: flex-end;

    &:after {
      content: '';
      display: block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--primary);
      margin-right: 8px;
    }
  }
</style>
