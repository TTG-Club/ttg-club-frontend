<script setup lang="ts">
  import { omit, orderBy, reverse } from 'lodash-es';
  import { NFlex, type SelectOption } from 'naive-ui';

  import { httpClient } from '@/shared/api';
  import { useAppBreakpoints } from '@/shared/composable/useAppBreakpoints';
  import type { TRaceLink } from '@/shared/types/character/Races';
  import {
    AbilityChoiceDouble,
    AbilityChoiceDoubleKey,
    AbilityKey,
    AbilityName,
    type AbilityRaceItem,
    type AbilityRoll,
    AbilityShortName,
    AbilityTypeKey,
    type ChoiceDouble,
    type CustomizableAbility,
    isCustomizableAbility,
    isDefaultAbility,
  } from '@/shared/types/tools/AbilityCalc';

  import RaceLink from '@/pages/character/races/RaceLink.vue';

  import type { AxiosResponse } from 'axios';

  defineProps<{
    modelValue: Array<AbilityRoll>;
  }>();

  const emit = defineEmits<{
    (e: 'update:model-value', v: Array<AbilityRoll>): void;
  }>();

  const style = useCssModule();
  const { smallerOrEqual } = useAppBreakpoints();
  const vertical = smallerOrEqual('sm');

  // Races
  const races = ref<Array<AbilityRaceItem>>([]);

  const getRaces = (): Promise<AxiosResponse<Array<TRaceLink>>> =>
    httpClient.post<Array<TRaceLink>>({
      url: '/races',
      payload: {
        size: -1,
        order: [
          {
            field: 'name',
            direction: 'asc',
          },
        ],
      },
    });

  const transformRaces = (list: Array<TRaceLink>): Array<AbilityRaceItem> =>
    orderBy(
      list.map((race) => {
        const updated: AbilityRaceItem = {
          label: `${race.name.rus} (${race.source.shortName})`,
          value: race.url,
          abilities: race.abilities,
          raw: omit(race, 'subraces'),
        };

        if (race.subraces?.length) {
          updated.subraces = transformRaces(race.subraces);
        }

        return updated;
      }),
      'label',
      'asc',
    );

  const updateRaces = async () => {
    try {
      const { data } = await getRaces();

      races.value = transformRaces(data);
    } catch (err) {
      console.error(err);
    }
  };

  updateRaces();

  // SubRaces
  const selectedRace = ref<AbilityRaceItem['value'] | null>(null);

  const getSelectedRace = (value: AbilityRaceItem['value'] | null) =>
    races.value?.find((item) => item.value === value) || null;

  const selectedRaceItem = computed(() => getSelectedRace(selectedRace.value));

  const subRaces = computed<Array<AbilityRaceItem>>(
    () => selectedRaceItem.value?.subraces || [],
  );

  const selectedSubRace = ref<AbilityRaceItem['value'] | null>(null);

  const getSelectedSubRace = (value: AbilityRaceItem['value'] | null) =>
    subRaces.value?.find((item) => item.value === value) || null;

  const selectedSubRaceItem = computed(() =>
    getSelectedSubRace(selectedSubRace.value),
  );

  // Custom race bonuses
  enum CUSTOM_BONUSES {
    First = 'first',
    Second = 'second',
    Third = 'third',
  }

  const customBonusChoice = reactive(
    new Map<CUSTOM_BONUSES, AbilityKey | null>([
      [CUSTOM_BONUSES.First, null],
      [CUSTOM_BONUSES.Second, null],
      [CUSTOM_BONUSES.Third, null],
    ]),
  );

  const isAbilitySelected = (key: AbilityKey) =>
    Array.from(customBonusChoice.values())
      .filter((item) => !!item)
      .includes(key);

  const abilities = computed<Array<SelectOption>>(() => {
    const keys: Array<AbilityKey> = Object.values(AbilityKey);

    return keys.map<SelectOption>((key) => ({
      value: key,
      label: AbilityName[key],
      class: isAbilitySelected(key) ? style.dotted : undefined,
    }));
  });

  const checkInstance = computed(
    () => selectedSubRaceItem.value || selectedRaceItem.value,
  );

  const customRaceBonuses = computed<Array<CustomizableAbility>>(
    () => checkInstance.value?.abilities.filter(isCustomizableAbility) || [],
  );

  const selectedChoiceDouble = ref<AbilityChoiceDoubleKey | null>(null);

  const choiceDouble = computed(
    (): Array<ChoiceDouble> =>
      reverse(
        Object.values(AbilityChoiceDoubleKey).map<ChoiceDouble>((value) => ({
          value,
          label: AbilityChoiceDouble[value],
        })),
      ),
  );

  const isChoiceDouble = computed(() => {
    if (!customRaceBonuses.value.length) {
      return false;
    }

    return (
      customRaceBonuses.value.length === 1 &&
      customRaceBonuses.value[0].key === AbilityTypeKey.CHOICE_DOUBLE
    );
  });

  const getFirstBonus = () => {
    if (isChoiceDouble.value && !selectedChoiceDouble.value) {
      return null;
    }

    if (
      isChoiceDouble.value &&
      selectedChoiceDouble.value === AbilityChoiceDoubleKey.FOR_TWO
    ) {
      return 2;
    }

    if (
      isChoiceDouble.value &&
      selectedChoiceDouble.value === AbilityChoiceDoubleKey.FOR_THREE
    ) {
      return 1;
    }

    const availTypes = [
      AbilityTypeKey.ONE,
      AbilityTypeKey.CHOICE,
      AbilityTypeKey.CHOICE_UNIQUE,
    ];

    for (const type of availTypes) {
      const ability = customRaceBonuses.value.find((item) => item.key === type);

      if (!ability) {
        continue;
      }

      return ability.value;
    }

    return null;
  };

  const getSecondBonus = () => {
    if (isChoiceDouble.value && !!selectedChoiceDouble.value) {
      return 1;
    }

    const oneIndex = customRaceBonuses.value.findIndex(
      (item) => item.key === AbilityTypeKey.ONE,
    );

    const ability = customRaceBonuses.value.find(
      (item) =>
        item.key ===
        (oneIndex > -1 ? AbilityTypeKey.CHOICE : AbilityTypeKey.CHOICE_UNIQUE),
    );

    return ability?.value || null;
  };

  const getThirdBonus = () => {
    if (
      isChoiceDouble.value &&
      selectedChoiceDouble.value === AbilityChoiceDoubleKey.FOR_THREE
    ) {
      return 1;
    }

    return null;
  };

  const customBonusValues = computed(
    () =>
      new Map<CUSTOM_BONUSES, number | null>([
        [CUSTOM_BONUSES.First, getFirstBonus()],
        [CUSTOM_BONUSES.Second, getSecondBonus()],
        [CUSTOM_BONUSES.Third, getThirdBonus()],
      ]),
  );

  const getResult = () => {
    const list: Array<AbilityRoll> =
      checkInstance.value?.abilities.filter(isDefaultAbility) || [];

    for (const bonusKey of Object.values(CUSTOM_BONUSES)) {
      const key = customBonusChoice.get(bonusKey);
      const value = customBonusValues.value.get(bonusKey);

      if (!value || !key) {
        continue;
      }

      list.push({
        key,
        value,
        name: AbilityName[key],
        shortName: AbilityShortName[key],
      });
    }

    return list;
  };

  const onSelectBonus = (field: CUSTOM_BONUSES, value: AbilityKey | null) => {
    for (const key of customBonusChoice.keys()) {
      if (key === field) {
        customBonusChoice.set(key, value);
      }

      if (key !== field && value === customBonusChoice.get(key)) {
        customBonusChoice.set(key, null);
      }
    }

    emit('update:model-value', getResult());
  };

  const onSelectChoiceDouble = (key: AbilityChoiceDoubleKey | null) => {
    selectedChoiceDouble.value = key;

    for (const bonusKey of customBonusChoice.keys()) {
      onSelectBonus(bonusKey, null);
    }
  };

  const onSelectSubRace = (value: AbilityRaceItem['value'] | null) => {
    selectedSubRace.value = value;

    emit('update:model-value', getResult());

    onSelectChoiceDouble(
      isChoiceDouble.value ? choiceDouble.value[0].value : null,
    );
  };

  const onSelectRace = (value: AbilityRaceItem['value'] | null) => {
    selectedRace.value = value;

    emit('update:model-value', getResult());
    onSelectSubRace(null);
  };
</script>

<template>
  <n-flex
    :wrap="false"
    :vertical
  >
    <div :class="{ [$style.race]: true, 'is-empty': !checkInstance }">
      <span
        v-if="!checkInstance"
        :class="$style.empty"
      >
        Раса не выбрана
      </span>

      <race-link
        v-else
        :race-item="checkInstance.raw"
        :to="{ path: checkInstance.raw.url }"
        is-ability-calc
      />
    </div>

    <n-grid
      cols="1 672:3"
      x-gap="16"
      y-gap="16"
    >
      <n-grid-item>
        <n-flex vertical>
          <n-text>Раса</n-text>

          <n-select
            :value="selectedRace"
            :options="races"
            :disabled="!races?.length"
            :show-checkmark="false"
            filterable
            clearable
            clear-filter-after-select
            placeholder="Выбрать расу"
            @update:value="onSelectRace"
          />
        </n-flex>
      </n-grid-item>

      <n-grid-item>
        <n-flex vertical>
          <n-text>Подраса</n-text>

          <n-select
            :value="selectedSubRace"
            :options="subRaces"
            :disabled="!subRaces?.length"
            :show-checkmark="false"
            filterable
            clearable
            clear-filter-after-select
            placeholder="Выбрать подрасу"
            @update:value="onSelectSubRace"
          />
        </n-flex>
      </n-grid-item>

      <n-grid-item>
        <n-flex vertical>
          <n-text>Набор характеристик</n-text>

          <n-select
            :value="selectedChoiceDouble"
            :options="choiceDouble"
            :disabled="!isChoiceDouble"
            :show-checkmark="false"
            clearable
            placeholder="Выбрать набор"
            @update:value="onSelectChoiceDouble"
          />
        </n-flex>
      </n-grid-item>

      <n-grid-item>
        <n-input-group>
          <n-input-group-label
            v-if="customBonusValues.get(CUSTOM_BONUSES.First)"
          >
            +{{ customBonusValues.get(CUSTOM_BONUSES.First) }}
          </n-input-group-label>

          <n-select
            :value="customBonusChoice.get(CUSTOM_BONUSES.First)"
            :options="abilities"
            :disabled="!customBonusValues.get(CUSTOM_BONUSES.First)"
            :show-checkmark="false"
            clearable
            placeholder="Выбери хар-ку"
            @update:value="onSelectBonus(CUSTOM_BONUSES.First, $event)"
          />
        </n-input-group>
      </n-grid-item>

      <n-grid-item>
        <n-input-group>
          <n-input-group-label
            v-if="customBonusValues.get(CUSTOM_BONUSES.Second)"
          >
            +{{ customBonusValues.get(CUSTOM_BONUSES.Second) }}
          </n-input-group-label>

          <n-select
            :value="customBonusChoice.get(CUSTOM_BONUSES.Second)"
            :options="abilities"
            :disabled="!customBonusValues.get(CUSTOM_BONUSES.Second)"
            :show-checkmark="false"
            clearable
            placeholder="Выбери хар-ку"
            @update:value="onSelectBonus(CUSTOM_BONUSES.Second, $event)"
          />
        </n-input-group>
      </n-grid-item>

      <n-grid-item>
        <n-input-group>
          <n-input-group-label
            v-if="customBonusValues.get(CUSTOM_BONUSES.Third)"
          >
            +{{ customBonusValues.get(CUSTOM_BONUSES.Third) }}
          </n-input-group-label>

          <n-select
            :value="customBonusChoice.get(CUSTOM_BONUSES.Third)"
            :options="abilities"
            :disabled="!customBonusValues.get(CUSTOM_BONUSES.Third)"
            :show-checkmark="false"
            clearable
            placeholder="Выбери хар-ку"
            @update:value="onSelectBonus(CUSTOM_BONUSES.Third, $event)"
          />
        </n-input-group>
      </n-grid-item>
    </n-grid>
  </n-flex>
</template>

<style module lang="scss">
  @use '@/assets/styles/variables/mixins' as *;

  .race {
    display: flex;
    flex-shrink: 0;
    align-items: stretch;
    justify-content: center;

    width: 100%;
    max-width: 270px;
    min-height: 111px;

    @include css-anim;

    .empty {
      cursor: not-allowed;

      display: flex;
      align-items: center;
      justify-content: center;

      width: 100%;

      color: var(--primary);
      border: {
        width: 1px;
        color: var(--primary);

        radius: 8px;
        style: dashed;
      }
    }
  }

  .dotted {
    flex-direction: row-reverse;
    justify-content: flex-end;

    &::after {
      content: '';

      display: block;

      width: 10px;
      height: 10px;
      margin-right: 8px;

      background-color: var(--primary);
      border-radius: 50%;
    }
  }
</style>
