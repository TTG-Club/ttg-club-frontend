<template>
  <ui-dropdown
    placeholder="Выбрать расу"
    :options="races"
  >
    <template #label>
      Расы
    </template>
  </ui-dropdown>

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
      <ui-select
        :custom-label="({ name: { rus } }) => rus"
        :disabled="!races?.length"
        :model-value="selectedRace"
        :options="races"
        allow-empty
        searchable
        track-by="url"
        @remove="onSelectRace"
        @select="onSelectRace"
      >
        <template #label>
          Раса
        </template>

        <template #singleLabel="{ option }">
          {{ option.name.rus }}
        </template>

        <template #option="{ option }">
          {{ option.name.rus }}
        </template>

        <template #placeholder>
          Выбрать расу
        </template>
      </ui-select>

      <ui-select
        :disabled="!subRaces?.length"
        :model-value="selectedSubRace"
        :options="subRaces"
        allow-empty
        is-wrap-disabled
        track-by="url"
        @select="onSelectSubRace"
      >
        <template #label>
          Подраса
        </template>

        <template #singleLabel="{ option }">
          {{ option.name.rus }}
        </template>

        <template #option="{ option }">
          {{ option.name.rus }}
        </template>

        <template #placeholder>
          Выбрать подрасу
        </template>
      </ui-select>

      <ui-select
        :disabled="!isChoiceDouble"
        :model-value="selectedChoiceDouble"
        :options="choiceDouble"
        label="label"
        track-by="key"
        @select="onSelectChoiceDouble"
      >
        <template #label>
          Набор характеристик
        </template>
      </ui-select>

      <ui-select
        :disabled="isFirstDisabled"
        :model-value="firstValue"
        :options="abilities"
        allow-empty
        class="ability-races__select"
        clear-on-select
        is-wrap-disabled
        label="name"
        track-by="key"
        @remove="onFirstSelect"
        @select="onFirstSelect"
      >
        <template
          v-if="firstLabel"
          #left-slot
        >
          {{ firstLabel }}
        </template>

        <template #singleLabel>
          {{ firstValue?.name || 'Выбрать хар-ку' }}
        </template>

        <template #placeholder>
          Выбери хар-ку
        </template>

        <template #option="{ option }">
          <span
            :class="{ 'is-used': isAbilitySelected(option.key) }"
            class="ability-races__select_option"
          >{{ option.name }}</span>
        </template>
      </ui-select>

      <ui-select
        :disabled="isSecondDisabled"
        :model-value="secondValue"
        :options="abilities"
        allow-empty
        class="ability-races__select"
        is-wrap-disabled
        label="name"
        track-by="key"
        @select="onSecondSelect"
      >
        <template
          v-if="secondLabel"
          #left-slot
        >
          {{ secondLabel }}
        </template>

        <template #singleLabel>
          {{ secondValue?.name || 'Выбрать хар-ку' }}
        </template>

        <template #placeholder>
          Выбери хар-ку
        </template>

        <template #option="{ option }">
          <span
            :class="{ 'is-used': isAbilitySelected(option.key) }"
            class="ability-races__select_option"
          >{{ option.name }}</span>
        </template>
      </ui-select>

      <ui-select
        :disabled="isThirdDisabled"
        :model-value="thirdValue"
        :options="abilities"
        allow-empty
        class="ability-races__select"
        is-wrap-disabled
        label="name"
        track-by="key"
        @select="onThirdSelect"
      >
        <template
          v-if="thirdLabel"
          #left-slot
        >
          {{ thirdLabel }}
        </template>

        <template #singleLabel>
          {{ thirdValue?.name || 'Выбрать хар-ку' }}
        </template>

        <template #placeholder>
          Выбери хар-ку
        </template>

        <template #option="{ option }">
          <span
            :class="{ 'is-used': isAbilitySelected(option.key) }"
            class="ability-races__select_option"
          >{{ option.name }}</span>
        </template>
      </ui-select>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue';
  import {
    computed, onBeforeMount, ref, watch
  } from 'vue';
  import cloneDeep from 'lodash/cloneDeep';
  import reverse from 'lodash/reverse';
  import type { TRaceLink } from '@/types/Character/Races.types';
  import RaceLink from '@/views/Character/Races/RaceLink.vue';
  import { usePagination } from '@/common/composition/usePagination';
  import UiSelect from '@/components/UI/kit/UiSelect.vue';
  import UiDropdown from "@/components/UI/kit/UiDropdown.vue";
  import type { AbilityRoll, ChoiceDouble } from '@/types/Tools/AbilityCalc.types';
  import {
    AbilityChoiceDouble,
    AbilityChoiceDoubleKey,
    AbilityKey,
    AbilityName,
    AbilityTypeKey
  } from '@/types/Tools/AbilityCalc.types';
  import { useRaceAbility } from '@/views/Tools/AbilityCalc/AbilityRaces/composition/useRaceAbility';

  const props = defineProps({
    modelValue: {
      type: Array as PropType<Array<AbilityRoll>>,
      required: true
    }
  });

  const emits = defineEmits(["update:model-value"]);

  const selectedRace = ref<TRaceLink | null>(null);
  const selectedSubRace = ref<TRaceLink | null>(null);

  const selectedChoiceDouble = ref<{
    key: AbilityChoiceDoubleKey
    label: AbilityChoiceDouble
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

  const races = computed(() => items.value.map((race: TRaceLink) => {
    const raceItem = cloneDeep(race);

    if (raceItem.subraces?.length) {
      raceItem.subraces = raceItem.subraces.map(item => ({
        ...item,
        image: raceItem.image
      }));
    }

    if (items.value.filter((item: TRaceLink) => raceItem.name.rus === item.name.rus).length >= 2) {
      return {
        ...raceItem,
        name: {
          ...raceItem.name,
          rus: `${ raceItem.name.rus } (${ raceItem.source.shortName })`
        }
      };
    }

    return raceItem;
  }));

  const subRaces = computed(() => selectedRace.value?.subraces || []);

  const choiceDouble = computed((): Array<ChoiceDouble> => reverse(Object
    .entries(AbilityChoiceDouble)
    .map(entry => ({
      key: entry[0] as AbilityChoiceDoubleKey,
      label: entry[1] as AbilityChoiceDouble
    }))));

  const getIsChoiceDouble = (race: TRaceLink) => (
    race.abilities.length === 1
    && race.abilities[0].key === AbilityTypeKey.CHOICE_DOUBLE
  );

  const checkInstance = computed(() => selectedSubRace.value || selectedRace.value);

  const isChoiceDouble = computed(() => (
    checkInstance.value
      ? getIsChoiceDouble(checkInstance.value)
      : false
  ));

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

  const isAbilitySelected = (key: AbilityKey) => (
    firstValue.value?.key === key
    || secondValue.value?.key === key
    || thirdValue.value?.key === key
  );

  onBeforeMount(async () => {
    await initPages();
  });

  const emitValue = () => {
    if (
      !isChoiceDouble.value
      && checkInstance.value?.abilities.length
      && !checkInstance.value?.abilities.find(ability => (
        Object.values(AbilityTypeKey)
          .includes(ability.key as AbilityTypeKey)
        && ability.key !== AbilityTypeKey.ALL
      ))) {
      emits('update:model-value', checkInstance.value?.abilities);

      return;
    }

    const value = [
      ...checkInstance.value?.abilities.filter(ability => (
        !Object.values(AbilityTypeKey)
          .includes(ability.key as AbilityTypeKey)
        || ability.key === AbilityTypeKey.ALL
      )) as Array<AbilityRoll>
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

    emits('update:model-value', value);
  };

  const onSelectChoiceDouble = (choice: ChoiceDouble | null) => {
    selectedChoiceDouble.value = choice;
    firstValue.value = null;
    secondValue.value = null;
    thirdValue.value = null;

    emitValue();
  };

  const onSelectSubRace = (subRace: TRaceLink | null) => {
    selectedSubRace.value = subRace;

    onSelectChoiceDouble(isChoiceDouble.value ? choiceDouble.value[0] : null);
  };

  const onSelectRace = (race: TRaceLink | null) => {
    const value = cloneDeep(race);

    if (value) {
      value.name.rus = value.name.rus.replace(/\(.+\)$/i, '');
    }

    selectedRace.value = value;

    onSelectSubRace(null);
  };

  watch([
    firstValue,
    secondValue,
    thirdValue
  ], () => {
    emitValue();
  });
</script>

<style lang="scss" scoped>
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
        };
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

    &__select {
      :deep(.multiselect__option) {
        padding: 0;

        .ability-races {
          &__select {
            &_option {
              padding: 12px 12px 12px 28px;

              &.is-used {
                &::before {
                  content: "";
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background-color: var(--primary);
                  position: absolute;
                  top: calc(50% - 5px);
                  left: 10px;
                }

                &:hover {
                  color: var(--text-btn-color);
                }
              }
            }
          }
        }
      }
    }
  }
</style>
