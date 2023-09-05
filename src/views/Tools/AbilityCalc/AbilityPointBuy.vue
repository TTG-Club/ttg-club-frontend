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
      <ui-select
        v-for="(roll, index) in modelValue"
        :key="index"
        :model-value="roll"
        :options="getOptions(roll)"
        class="ability-point-buy__select"
        label="value"
        track-by="key"
        @select="roll.value = $event.key"
      >
        <template #left-slot>
          {{ String(roll.shortName).toUpperCase() }}
        </template>

        <template #singleLabel>
          {{ roll.value || 'Выбрать значение' }}
        </template>

        <template #placeholder> Выбрать значение </template>

        <template #option="{ option }">
          {{ getLabel(roll, option) }}
        </template>
      </ui-select>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onActivated, ref } from 'vue';

  import { getPlural } from '@/shared/helpers/string';

  import UiButton from '@/components/UI/kit/button/UiButton.vue';
  import UiSelect from '@/components/UI/kit/UiSelect.vue';

  import type { PropType } from 'vue';

  import type { AbilityRoll } from '@/types/Tools/AbilityCalc.d';
  import {
    AbilityKey,
    AbilityName,
    AbilityShortName
  } from '@/types/Tools/AbilityCalc.d';

  export default defineComponent({
    components: {
      UiSelect,
      UiButton
    },
    props: {
      modelValue: {
        type: Array as PropType<Array<AbilityRoll>>,
        required: true
      }
    },
    setup(props, { emit }) {
      const cost = [
        {
          key: 8,
          value: 0
        },
        {
          key: 9,
          value: 1
        },
        {
          key: 10,
          value: 2
        },
        {
          key: 11,
          value: 3
        },
        {
          key: 12,
          value: 4
        },
        {
          key: 13,
          value: 5
        },
        {
          key: 14,
          value: 7
        },
        {
          key: 15,
          value: 9
        }
      ];

      const rolls = ref<Array<AbilityRoll>>([
        {
          shortName: AbilityShortName.STRENGTH,
          name: AbilityName.STRENGTH,
          key: AbilityKey.STRENGTH,
          value: 8
        },
        {
          shortName: AbilityShortName.DEXTERITY,
          name: AbilityName.DEXTERITY,
          key: AbilityKey.DEXTERITY,
          value: 8
        },
        {
          shortName: AbilityShortName.CONSTITUTION,
          name: AbilityName.CONSTITUTION,
          key: AbilityKey.CONSTITUTION,
          value: 8
        },
        {
          shortName: AbilityShortName.INTELLIGENCE,
          name: AbilityName.INTELLIGENCE,
          key: AbilityKey.INTELLIGENCE,
          value: 8
        },
        {
          shortName: AbilityShortName.WISDOM,
          name: AbilityName.WISDOM,
          key: AbilityKey.WISDOM,
          value: 8
        },
        {
          shortName: AbilityShortName.CHARISMA,
          name: AbilityName.CHARISMA,
          key: AbilityKey.CHARISMA,
          value: 8
        }
      ]);

      emit('update:model-value', rolls.value);

      onActivated(() => {
        emit('update:model-value', rolls.value);
      });

      const sum = computed(() =>
        rolls.value.reduce((partialSum, roll) => {
          const costItem = cost.find(item => item.key === roll.value);

          if (!costItem) {
            return partialSum;
          }

          return partialSum + costItem.value;
        }, 0)
      );

      const getOptions = (roll: AbilityRoll) => {
        const rollValue = cost.find(costItem => costItem.key === roll.value);

        if (!rollValue) {
          return 'wtf?!';
        }

        return cost.filter(
          item => sum.value + item.value - rollValue.value <= 27
        );
      };

      const getLabel = (
        roll: (typeof rolls.value)[number],
        option: (typeof cost)[number]
      ) => {
        let result = `${option.key}`;

        const costItem = cost.find(item => item.key === roll.value);

        if (!costItem) {
          return 'wtf?!';
        }

        const difference = costItem.value - option.value;
        const sign = Math.sign(difference) > -1 ? '+' : '-';

        const plural = getPlural(Math.abs(difference), [
          'очко',
          'очка',
          'очков'
        ]);

        if (Math.abs(difference) > 0) {
          result += ` (${sign}${Math.abs(difference)} ${plural})`;
        }

        return result;
      };

      const onReset = () => {
        for (let i = 0; i < rolls.value.length; i++) {
          rolls.value[i].value = 8;
        }

        emit('update:model-value', rolls.value);
      };

      return {
        abilities: computed(() =>
          Object.keys(AbilityKey).map(key => ({
            key,
            name: AbilityName[key as AbilityKey]
          }))
        ),
        sum,
        getOptions,
        getLabel,
        onReset
      };
    }
  });
</script>

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
