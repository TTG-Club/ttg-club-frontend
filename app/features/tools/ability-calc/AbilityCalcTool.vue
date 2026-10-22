<script setup lang="ts">
  import type { AbilityMethod, AbilityScores } from '../model';

  import { RACES_SECTION } from '~character/model';
  import { SectionLayout } from '~section/layout';
  import { buildListRequest, SECTION_PAGE_SIZE_ALL } from '~section/model';

  import {
    ABILITY_CALC_TEXT,
    ABILITY_METHODS,
    abilityRacesSchema,
  } from '../model';
  import AbilityPointBuy from './AbilityPointBuy.vue';
  import AbilityRaceBonuses from './AbilityRaceBonuses.vue';
  import AbilityRandom from './AbilityRandom.vue';
  import AbilityStandard from './AbilityStandard.vue';
  import AbilityTable from './AbilityTable.vue';

  /**
   * Калькулятор характеристик: слева раса с бонусами, справа способ
   * получить значения и итог с модификаторами. У каждого способа свои
   * значения, переключение их не сбрасывает.
   */
  const { data: races } = await useAsyncData(
    'tools-ability-calc-races',
    async () =>
      abilityRacesSchema.parse(
        await $fetch(RACES_SECTION.listUrl, {
          method: 'POST',
          body: buildListRequest({
            page: 0,
            size: SECTION_PAGE_SIZE_ALL,
            order: RACES_SECTION.order,
          }),
        }),
      ),
    { deep: false },
  );

  const method = ref<AbilityMethod>(ABILITY_METHODS[0].value);

  const methodItems = ABILITY_METHODS.map((item) => ({
    label: item.label,
    value: item.value,
    slot: item.value,
  }));

  const random = ref<AbilityScores>({});
  const pointBuy = ref<AbilityScores>({});
  const standard = ref<AbilityScores>({});
  const bonuses = ref<AbilityScores>({});

  const scores = computed(() => {
    if (method.value === 'pointBuy') {
      return pointBuy.value;
    }

    return method.value === 'standard' ? standard.value : random.value;
  });
</script>

<template>
  <SectionLayout :title="ABILITY_CALC_TEXT.title">
    <template #controls>
      <AbilityRaceBonuses
        v-model="bonuses"
        :races="races ?? []"
      />
    </template>

    <div class="flex flex-col gap-6">
      <UTabs
        v-model="method"
        :items="methodItems"
        :unmount-on-hide="false"
        :aria-label="ABILITY_CALC_TEXT.methods"
        :ui="{ content: 'pt-4' }"
      >
        <template #random>
          <AbilityRandom v-model="random" />
        </template>

        <template #pointBuy>
          <AbilityPointBuy v-model="pointBuy" />
        </template>

        <template #standard>
          <AbilityStandard v-model="standard" />
        </template>
      </UTabs>

      <AbilityTable
        :scores="scores"
        :bonuses="bonuses"
      />
    </div>
  </SectionLayout>
</template>
