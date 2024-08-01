<script setup lang="ts">
  import {
    type AbilityRoll,
    AbilityKey,
    AbilityName,
    AbilityShortName,
  } from '@/shared/types/tools/AbilityCalc';
  import { getFormattedModifier } from '@/shared/utils/abilityTransforms';

  const props = defineProps<{
    rolls: Array<AbilityRoll>;
    raceBonuses: Array<AbilityRoll>;
  }>();

  const abilities = computed(() =>
    Object.values(AbilityKey).map((key: AbilityKey) => {
      const roll = props.rolls.find((item) => item.key === key);

      const getValue = () => {
        if (typeof roll?.value !== 'number') {
          return '−';
        }

        return roll.value;
      };

      const getRaceBonus = () => {
        const bonus = props.raceBonuses.find((item) => item.key === key)?.value;

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
        modifier: getModifier(),
      };
    }),
  );
</script>

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

<style lang="scss" scoped>
  @use '@/assets/styles/variables/breakpoints' as *;

  .ability-table {
    cursor: default;

    display: grid;
    grid-template-columns: 1fr 4fr;
    gap: 12px;

    width: 100%;

    @include media-max($xl) {
      display: flex;
    }

    &__body {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      padding-bottom: 16px;

      @include media-max($xl) {
        overflow: auto;
        display: flex;
        grid-template-columns: initial;
        flex: 1 1 auto;
        justify-content: space-between;
      }
    }

    &__col {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 18px;

      padding: 12px 0;

      border-radius: 16px;

      &.is-aside {
        flex-shrink: 0;

        @media (width <= 768px) {
          display: none;
        }
      }

      &:not(.is-aside) {
        align-items: center;
        background-color: var(--bg-secondary);
      }

      @media (width <= 768px) {
        width: 100%;
        padding: 12px 0;
      }

      @include media-max($xl) {
        width: 112px;
      }
    }

    &__row {
      display: flex;
      align-items: center;

      width: 100%;

      font-size: var(--h5-font-size);
      line-height: 27px;
      color: var(--text-b-color);

      &:not(.is-aside) {
        justify-content: center;
      }

      &.is-ability {
        text-transform: uppercase;
      }

      &:not(.is-aside):nth-child(4) {
        max-width: 40px;
        margin: 0 auto;
        background-color: var(--bg-table-row);
        border-radius: 8px;
      }

      &:not(.is-aside):last-child {
        max-width: 40px;
        margin: 0 auto;

        color: var(--text-btn-color);

        background-color: var(--primary);
        border-radius: 8px;
      }
    }
  }
</style>
