<script setup lang="ts">
  import type {
    AbilityKey,
    AbilityRace,
    AbilityScores,
    AbilitySplit,
  } from '../model';

  import {
    ABILITIES,
    ABILITY_CALC_TEXT,
    ABILITY_SPLITS,
    assignUnique,
    buildRaceBonuses,
    getRaceBonusSlots,
    isSplitBonus,
  } from '../model';

  /**
   * Раса и подраса с их бонусами к характеристикам. Бонусы на выбор («к
   * одной», «+2 и +1 / +1 к трём») распределяются по ячейкам, каждой
   * ячейке — своя характеристика.
   */
  const { races } = defineProps<{
    races: Array<AbilityRace>;
  }>();

  const bonuses = defineModel<AbilityScores>({ required: true });

  const raceUrl = ref<string>();
  const subraceUrl = ref<string>();
  const split = ref<AbilitySplit>();
  const keys = ref<Array<AbilityKey | undefined>>([]);

  /**
   * Пункт списка рас: название с книгой, как в старом SPA.
   * @param race - раса или подраса
   */
  function toItem(race: {
    name: AbilityRace['name'];
    url: string;
    source?: AbilityRace['source'];
  }) {
    const source = race.source?.shortName;

    return {
      label: source ? `${race.name.rus} (${source})` : race.name.rus,
      value: race.url,
    };
  }

  const raceItems = computed(() =>
    races.map(toItem).toSorted((a, b) => a.label.localeCompare(b.label, 'ru')),
  );

  const race = computed(() => races.find((item) => item.url === raceUrl.value));

  const subraces = computed(() => race.value?.subraces ?? []);

  const subraceItems = computed(() => subraces.value.map(toItem));

  const subrace = computed(() =>
    subraces.value.find((item) => item.url === subraceUrl.value),
  );

  // Бонусы подрасы уже включают бонусы расы; у подрасы без своих — расы
  const raceBonuses = computed(() => {
    const own = subrace.value?.abilities;

    return own?.length ? own : (race.value?.abilities ?? []);
  });

  const isSplit = computed(() => isSplitBonus(raceBonuses.value));

  const slots = computed(() =>
    getRaceBonusSlots(raceBonuses.value, split.value),
  );

  const abilityItems = computed(() =>
    ABILITIES.map((ability) => ({
      label: ability.name,
      value: ability.key,
      chip: keys.value.includes(ability.key)
        ? { color: 'primary' as const }
        : undefined,
    })),
  );

  const splitItems = [...ABILITY_SPLITS];

  /**
   * Назначает характеристику ячейке бонуса.
   * @param index - ячейка
   * @param key - характеристика; пусто — снять
   */
  function assign(index: number, key: AbilityKey | null | undefined): void {
    keys.value = assignUnique(keys.value, index, key ?? undefined);
  }

  // Новая раса начинает выбор заново, набор — с «+2 и +1»
  watch(raceUrl, () => {
    subraceUrl.value = undefined;
  });

  watch(
    raceBonuses,
    () => {
      split.value = isSplit.value ? ABILITY_SPLITS[0].value : undefined;
    },
    { immediate: true },
  );

  watch(slots, (value) => {
    keys.value = value.map(() => undefined);
  });

  watch(
    [raceBonuses, slots, keys],
    () => {
      bonuses.value = buildRaceBonuses(
        raceBonuses.value,
        slots.value,
        keys.value,
      );
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <UFormField :label="ABILITY_CALC_TEXT.race">
      <USelectMenu
        v-model="raceUrl"
        :items="raceItems"
        :placeholder="ABILITY_CALC_TEXT.racePlaceholder"
        :disabled="!raceItems.length"
        value-key="value"
        clear
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="subraceItems.length"
      :label="ABILITY_CALC_TEXT.subrace"
    >
      <USelectMenu
        v-model="subraceUrl"
        :items="subraceItems"
        :placeholder="ABILITY_CALC_TEXT.subracePlaceholder"
        :search-input="false"
        value-key="value"
        clear
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="isSplit"
      :label="ABILITY_CALC_TEXT.split"
    >
      <USelect
        v-model="split"
        :items="splitItems"
        :placeholder="ABILITY_CALC_TEXT.splitPlaceholder"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="slots.length"
      :label="ABILITY_CALC_TEXT.bonuses"
    >
      <div class="flex flex-col gap-2">
        <UFieldGroup
          v-for="(value, index) in slots"
          :key="index"
          class="w-full"
        >
          <UBadge
            :label="`+${value}`"
            color="neutral"
            variant="subtle"
            size="lg"
            class="w-12 shrink-0 justify-center"
          />

          <USelectMenu
            :model-value="keys[index]"
            :items="abilityItems"
            :placeholder="ABILITY_CALC_TEXT.bonusPlaceholder"
            :search-input="false"
            value-key="value"
            clear
            class="w-full"
            @update:model-value="assign(index, $event)"
          />
        </UFieldGroup>
      </div>
    </UFormField>
  </div>
</template>
