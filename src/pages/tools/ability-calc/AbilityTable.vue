<template>
  <div class="ability-table">
    <div class="ability-table__col is-aside">
      <div class="ability-table__row is-aside">Хар-ка</div>

      <div class="ability-table__row is-aside">Значение</div>

      <div class="ability-table__row is-aside">Бон. расы</div>

      <div class="ability-table__row is-aside">Модиф.</div>

      <div class="ability-table__row is-aside">Итого</div>
    </div>

    <div class="ability-table__body">
      <div
        v-for="(ability, key) in abilities"
        :key="key"
        class="ability-table__col"
      >
        <div class="ability-table__row is-ability">
          {{ ability.shortName }}
        </div>

        <div class="ability-table__row">
          {{ ability.value }}
        </div>

        <div class="ability-table__row">
          {{ ability.raceBonus }}
        </div>

        <div class="ability-table__row">
          {{ ability.modifier }}
        </div>

        <div class="ability-table__row">
          {{ ability.result }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';

  import { getFormattedModifier } from '@/shared/helpers/abilityTransforms';
  import type { AbilityRoll } from '@/shared/types/tools/AbilityCalc.d';
  import {
    AbilityKey,
    AbilityName,
    AbilityShortName
  } from '@/shared/types/tools/AbilityCalc.d';

  import type { PropType } from 'vue';

  export default defineComponent({
    props: {
      rolls: {
        type: Array as PropType<Array<AbilityRoll>>,
        required: true
      },
      raceBonuses: {
        type: Array as PropType<Array<AbilityRoll>>,
        required: true
      }
    },
    setup(props) {
      const abilities = computed(() =>
        Object.values(AbilityKey).map((key: AbilityKey) => {
          const roll = props.rolls.find(item => item.key === key);

          const getValue = () => {
            if (typeof roll?.value !== 'number') {
              return '−';
            }

            return roll.value;
          };

          const getRaceBonus = () => {
            const bonus = props.raceBonuses.find(item => item.key === key)
              ?.value;

            if (!bonus && bonus !== 0) {
              return '−';
            }

            return bonus;
          };

          const getResult = () => {
            let result = 0;

            if (typeof roll?.value === 'number') {
              result += roll.value;
            }

            const raceBonus = getRaceBonus();

            if (typeof raceBonus === 'number') {
              result += raceBonus;
            }

            return result;
          };

          const getModifier = () => getFormattedModifier(getResult());

          return {
            key,
            name: AbilityName[key],
            shortName: AbilityShortName[key],
            value: getValue(),
            raceBonus: getRaceBonus(),
            result: getResult(),
            modifier: getModifier()
          };
        })
      );

      return {
        AbilityKey,
        AbilityShortName,

        abilities
      };
    }
  });
</script>

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .ability-table {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 4fr;
    gap: 12px;
    cursor: default;

    @include media-max($xl) {
      display: flex;
    }

    &__body {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(6, 1fr);
      padding-bottom: 16px;

      @include media-max($xl) {
        grid-template-columns: initial;
        display: flex;
        flex: 1 1 auto;
        overflow: auto;
        justify-content: space-between;
      }
    }

    &__col {
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow: hidden;
      border-radius: 16px;
      padding: 12px 0;

      @include media-max($xl) {
        width: 112px;
      }

      @media (max-width: 768px) {
        width: 100%;
        padding: 12px 0;
      }

      &.is-aside {
        flex-shrink: 0;

        @media (max-width: 768px) {
          display: none;
        }
      }

      &:not(.is-aside) {
        align-items: center;
        background-color: var(--bg-secondary);
      }
    }

    &__row {
      font-size: var(--h5-font-size);
      line-height: 27px;
      color: var(--text-b-color);
      width: 100%;
      display: flex;
      align-items: center;

      &:not(.is-aside) {
        justify-content: center;
      }

      &.is-ability {
        text-transform: uppercase;
      }

      &:not(.is-aside):nth-child(4) {
        background-color: var(--bg-table-row);
        margin: 0 auto;
        max-width: 40px;
        border-radius: 8px;
      }

      &:not(.is-aside):last-child {
        background-color: var(--primary);
        color: var(--text-btn-color);
        margin: 0 auto;
        max-width: 40px;
        border-radius: 8px;
      }
    }
  }
</style>
