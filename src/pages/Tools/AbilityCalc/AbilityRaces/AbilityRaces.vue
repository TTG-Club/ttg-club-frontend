<template>
  <div class="ability-races">
    <div
      :class="{ 'is-empty': !checkInstance }"
      class="ability-races__race"
    >
      <span
        v-if="!checkInstance"
        class="ability-races__race--empty"
      >
        Раса не выбрана
      </span>

      <race-link
        v-else
        :race-item="checkInstance"
        :to="{ path: checkInstance.url }"
        is-ability-calc
      />
    </div>

    <div class="ability-races__fields">
      <ui-multiselect
        v-model="selectedRace"
        track-by="url"
        label="name.rus"
        is-searchable
        placeholder="Выбрать расу"
        :options="races"
        @update:model-value="onSelectRace"
      >
        <template #label>Раса</template>
      </ui-multiselect>

      <ui-multiselect
        v-model="selectedSubRace"
        track-by="url"
        label="name.rus"
        :disabled="!subRaces?.length"
        placeholder="Выбрать подрасу"
        :options="subRaces"
        @update:model-value="onSelectSubRace"
      >
        <template #label>Подраса</template>
      </ui-multiselect>

      <ui-multiselect
        v-model="selectedChoiceDouble"
        track-by="key"
        label="label"
        :disabled="!isChoiceDouble"
        placeholder="Выбери что-нибудь"
        :options="choiceDouble"
        @update:model-value="onSelectChoiceDouble"
      >
        <template #label>Набор характеристик</template>
      </ui-multiselect>

      <ui-multiselect
        v-model="firstValue"
        track-by="key"
        label="name"
        :disabled="isFirstDisabled"
        :options="abilities"
        placeholder="Выбери хар-ку"
        @update:model-value="onFirstSelect"
      >
        <template
          v-if="firstLabel"
          #left-slot
        >
          {{ firstLabel }}
        </template>

        <template #option="{ name, key }">
          <span
            :class="{ 'in-use': isAbilitySelected(key) }"
            class="ui-select__option"
            >{{ name }}</span
          >
        </template>
      </ui-multiselect>

      <ui-multiselect
        v-model="secondValue"
        track-by="key"
        label="name"
        :disabled="isSecondDisabled"
        :options="abilities"
        placeholder="Выбери хар-ку"
        @update:model-value="onSecondSelect"
      >
        <template
          v-if="secondLabel"
          #left-slot
        >
          {{ secondLabel }}
        </template>

        <template #option="{ name, key }">
          <span
            :class="{ 'in-use': isAbilitySelected(key) }"
            class="ui-select__option"
            >{{ name }}</span
          >
        </template>
      </ui-multiselect>

      <ui-multiselect
        v-model="thirdValue"
        track-by="key"
        label="name"
        :disabled="isThirdDisabled"
        :options="abilities"
        placeholder="Выбери хар-ку"
        @update:model-value="onThirdSelect"
      >
        <template
          v-if="thirdLabel"
          #left-slot
        >
          {{ thirdLabel }}
        </template>

        <template #option="{ name, key }">
          <span
            :class="{ 'in-use': isAbilitySelected(key) }"
            class="ui-select__option"
            >{{ name }}</span
          >
        </template>
      </ui-multiselect>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { cloneDeep, reverse } from 'lodash-es';
  import { computed, onBeforeMount, ref, watch } from 'vue';

  import RaceLink from '@/pages/Character/Races/RaceLink.vue';
  import { useRaceAbility } from '@/pages/Tools/AbilityCalc/AbilityRaces/composition/useRaceAbility';

  import { usePagination } from '@/shared/compositions/usePagination';
  import type { TRaceLink } from '@/shared/types/Character/Races.d';
  import type {
    AbilityRoll,
    ChoiceDouble
  } from '@/shared/types/Tools/AbilityCalc.d';
  import {
    AbilityChoiceDouble,
    AbilityChoiceDoubleKey,
    AbilityKey,
    AbilityName,
    AbilityTypeKey
  } from '@/shared/types/Tools/AbilityCalc.d';
  import UiMultiselect from '@/shared/ui/kit/UiMultiselect.vue';

  const modelValue = defineModel({
    required: true
  });

  const selectedRace = ref<TRaceLink | null>(null);
  const selectedSubRace = ref<TRaceLink | null>(null);

  const selectedChoiceDouble = ref<{
    key: AbilityChoiceDoubleKey;
    label: AbilityChoiceDouble;
  } | null>(null);

  const { initPages, items } = usePagination({
    url: '/races',
    limit: -1,
    order: [
      {
        field: 'name',
        direction: 'asc'
      }
    ]
  });

  const races = computed(() =>
    items.value.map((race: TRaceLink) => {
      const raceItem = cloneDeep(race);

      if (raceItem.subraces?.length) {
        raceItem.subraces = raceItem.subraces.map(item => ({
          ...item,
          image: raceItem.image
        }));
      }

      if (
        items.value.filter(
          (item: TRaceLink) => raceItem.name.rus === item.name.rus
        ).length >= 2
      ) {
        return {
          ...raceItem,
          name: {
            ...raceItem.name,
            rus: `${raceItem.name.rus} (${raceItem.source.shortName})`
          }
        };
      }

      return raceItem;
    })
  );

  const subRaces = computed(() => selectedRace.value?.subraces || []);

  const choiceDouble = computed(
    (): Array<ChoiceDouble> =>
      reverse(
        Object.entries(AbilityChoiceDouble).map(entry => ({
          key: entry[0] as AbilityChoiceDoubleKey,
          label: entry[1] as AbilityChoiceDouble
        }))
      )
  );

  const getIsChoiceDouble = (race: TRaceLink) =>
    race.abilities.length === 1 &&
    race.abilities[0].key === AbilityTypeKey.CHOICE_DOUBLE;

  const checkInstance = computed(
    () => selectedSubRace.value || selectedRace.value
  );

  const isChoiceDouble = computed(() =>
    checkInstance.value ? getIsChoiceDouble(checkInstance.value) : false
  );

  const {
    firstValue,
    firstLabel,
    isFirstDisabled,
    onFirstSelect,

    secondValue,
    secondLabel,
    isSecondDisabled,
    onSecondSelect,

    thirdValue,
    thirdLabel,
    isThirdDisabled,
    onThirdSelect
  } = useRaceAbility({
    isChoiceDouble,
    selectedChoiceDouble,
    checkInstance
  });

  const abilities = computed(() => {
    const keys: Array<AbilityKey> = Object.values(AbilityKey);

    return keys.map(key => ({
      key,
      name: AbilityName[key]
    }));
  });

  const isAbilitySelected = (key: AbilityKey) =>
    firstValue.value?.key === key ||
    secondValue.value?.key === key ||
    thirdValue.value?.key === key;

  onBeforeMount(async () => {
    await initPages();
  });

  const emitValue = () => {
    if (
      !isChoiceDouble.value &&
      checkInstance.value?.abilities.length &&
      !checkInstance.value?.abilities.find(
        ability =>
          Object.values(AbilityTypeKey).includes(
            ability.key as AbilityTypeKey
          ) && ability.key !== AbilityTypeKey.ALL
      )
    ) {
      modelValue.value = checkInstance.value?.abilities;

      return;
    }

    const value = [
      ...(checkInstance.value?.abilities.filter(
        ability =>
          !Object.values(AbilityTypeKey).includes(
            ability.key as AbilityTypeKey
          ) || ability.key === AbilityTypeKey.ALL
      ) as Array<AbilityRoll>)
    ];

    if (firstValue.value) {
      value.push(firstValue.value);
    }

    if (secondValue.value) {
      value.push(secondValue.value);
    }

    if (thirdValue.value) {
      value.push(thirdValue.value);
    }

    modelValue.value = value;
  };

  const onSelectChoiceDouble = () => {
    firstValue.value = null;
    secondValue.value = null;
    thirdValue.value = null;

    emitValue();
  };

  const onSelectSubRace = () => {
    selectedChoiceDouble.value = isChoiceDouble.value
      ? choiceDouble.value[0]
      : null;

    onSelectChoiceDouble();
  };

  const onSelectRace = () => {
    selectedSubRace.value = null;

    onSelectSubRace();
  };

  watch([firstValue, secondValue, thirdValue], () => {
    emitValue();
  });
</script>

<style lang="scss" scoped>
  .ui-select__option {
    position: relative;
    &.in-use {
      &::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--primary);
        position: absolute;
        top: calc(50% - 4px);
        left: calc(-14px - 5px); // half of span's padding
      }
    }
  }

  .ability-races {
    display: flex;
    gap: 32px;
    // grid-template-columns: 270px auto;

    @media (max-width: 991px) {
      flex-direction: column;
    }

    &__race {
      @include css_anim();

      width: 100%;
      max-width: 270px;
      height: 136px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &--empty {
        color: var(--primary);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: not-allowed;
        border: {
          width: 1px;
          radius: 8px;
          style: dashed;
          color: var(--primary);
        }
      }

      @media (max-width: 991px) {
        max-width: 100%;
      }
    }

    &__fields {
      flex: 1 1 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 32px 24px;

      .ui-select {
        width: calc(100% / 3 - 24px * 2 / 3);

        @media (max-width: 576px) {
          width: 100%;
        }
      }

      @media (max-width: 576px) {
        gap: 16px 24px;
      }
    }
  }
</style>
