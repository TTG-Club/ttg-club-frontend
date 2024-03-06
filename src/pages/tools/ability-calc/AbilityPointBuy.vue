<script setup lang="ts">
  import { computed, onActivated, ref } from 'vue';

  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc.d';
  import {
    AbilityKey,
    AbilityName,
    AbilityShortName,
  } from '@/shared/types/tools/AbilityCalc.d';
  import UiButton from '@/shared/ui/kit/button/UiButton.vue';
  import UiMultiselect from '@/shared/ui/kit/UiMultiselect.vue';
  import { getPlural } from '@/shared/utils/string';

  const modelValue = defineModel<Array<AbilityRoll>>({
    required: true,
  });

  const selectedOptions = ref<
    Array<{ value: number; cost: number; label: string }>
  >([]);

  const cost = ref([
    {
      value: 8,
      cost: 0,
    },
    {
      value: 9,
      cost: 1,
    },
    {
      value: 10,
      cost: 2,
    },
    {
      value: 11,
      cost: 3,
    },
    {
      value: 12,
      cost: 4,
    },
    {
      value: 13,
      cost: 5,
    },
    {
      value: 14,
      cost: 7,
    },
    {
      value: 15,
      cost: 9,
    },
  ]);

  const rolls = ref<Array<AbilityRoll>>([
    {
      shortName: AbilityShortName.STRENGTH,
      name: AbilityName.STRENGTH,
      key: AbilityKey.STRENGTH,
      value: 8,
    },
    {
      shortName: AbilityShortName.DEXTERITY,
      name: AbilityName.DEXTERITY,
      key: AbilityKey.DEXTERITY,
      value: 8,
    },
    {
      shortName: AbilityShortName.CONSTITUTION,
      name: AbilityName.CONSTITUTION,
      key: AbilityKey.CONSTITUTION,
      value: 8,
    },
    {
      shortName: AbilityShortName.INTELLIGENCE,
      name: AbilityName.INTELLIGENCE,
      key: AbilityKey.INTELLIGENCE,
      value: 8,
    },
    {
      shortName: AbilityShortName.WISDOM,
      name: AbilityName.WISDOM,
      key: AbilityKey.WISDOM,
      value: 8,
    },
    {
      shortName: AbilityShortName.CHARISMA,
      name: AbilityName.CHARISMA,
      key: AbilityKey.CHARISMA,
      value: 8,
    },
  ]);

  onActivated(() => {
    modelValue.value = rolls.value;
  });

  const sum = computed(() =>
    modelValue.value.reduce((partialSum, roll) => {
      const costItem = cost.value.find((item) => item.value === roll.value);

      if (!costItem) {
        return partialSum;
      }

      return partialSum + costItem.cost;
    }, 0),
  );

  const onReset = () => {
    for (let i = 0; i < modelValue.value.length; i++) {
      modelValue.value[i].value = 8;
    }

    selectedOptions.value = [];
  };

  const getOptions = (roll: AbilityRoll) => {
    const rollValue = cost.value.find(
      (costItem) => costItem.value === roll.value,
    );

    if (!rollValue) {
      return 'wtf?!';
    }

    const options = cost.value.filter(
      (item) => sum.value + item.cost - rollValue.cost <= 27,
    );

    return options.map((el) => {
      let result = `${el.value}`;

      const difference = rollValue.cost - el.cost;
      const sign = Math.sign(difference) > -1 ? '+' : '-';

      const plural = getPlural(Math.abs(difference), ['очко', 'очка', 'очков']);

      if (Math.abs(difference) > 0) {
        result += ` (${sign}${Math.abs(difference)} ${plural})`;
      }

      return { ...el, label: result };
    });
  };

  const onSelect = (i: number) => {
    modelValue.value[i].value = selectedOptions.value[i].value;

    [selectedOptions.value[i].label] =
      selectedOptions.value[i].label.split(' ');
  };
</script>

<template>
  <div class="ability-point-buy">
    <div class="ability-point-buy__blocks">
      <div class="ability-point-buy__block">Очков: {{ 27 - sum }} / 27</div>

      <ui-button
        class="ability-point-buy__block is-btn"
        size="sm"
        full-width
        @click.left.exact.prevent="onReset"
      >
        Сбросить
      </ui-button>
    </div>

    <div
      v-if="modelValue.length"
      class="ability-point-buy__controls"
    >
      <div
        v-for="(roll, i) in modelValue"
        :key="i"
      >
        <ui-multiselect
          v-model="selectedOptions[i]"
          :options="getOptions(roll)"
          class="ability-point-buy__select"
          label="label"
          track-by="value"
          :placeholder="roll.value || 'Выбрать значение'"
          @update:model-value="onSelect(i)"
        >
          <template #left-slot>
            {{ String(roll.shortName).toUpperCase() }}
          </template>
        </ui-multiselect>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .ability-point-buy {
    display: flex;
    gap: 32px;

    &__blocks {
      min-width: 124px;
      gap: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      flex-shrink: 0;
    }

    &__block {
      flex: 1 1 auto;

      &:not(.is-btn) {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-table-list);
        border-radius: 6px;
        padding: 8px;
        color: var(--text-b-color);
        font-size: var(--main-font-size);
        line-height: calc(var(--main-line-height) - 1px);
      }
    }

    &__controls {
      flex: 1 1 auto;
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr 1fr 1fr;

      @media (max-width: 576px) {
        display: flex;
        flex-direction: column;
      }
    }

    &__select {
      &_placeholder {
        display: flex;
      }

      &_roll {
      }
    }

    .ability-table {
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }
</style>
