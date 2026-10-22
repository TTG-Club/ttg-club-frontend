<script setup lang="ts">
  import type { TraderRequest } from '../model';

  import { useToolGenerator } from '../composables';
  import { ToolChip, ToolGenerator } from '../generator';
  import { LootMagicItems } from '../loot';
  import {
    getTraderPrice,
    groupLoot,
    LOOT_TEXT,
    TOOLS_API_URL,
    TRADER_MAGIC_LEVEL_DEFAULT,
    TRADER_PERSUASION_MIN,
    TRADER_TEXT,
    traderOptionsSchema,
    traderResultSchema,
  } from '../model';

  /**
   * Торговец магическими предметами: проверка Убеждения и количество магии
   * задают ассортимент, цены — по выбранной книге. Новый поиск заменяет
   * прежний список.
   */
  const { data: options } = await useAsyncData(
    'tools-trader-options',
    async () => traderOptionsSchema.parse(await $fetch(TOOLS_API_URL.trader)),
    { deep: false },
  );

  const persuasion = ref<number | null>(TRADER_PERSUASION_MIN);
  const magicLevel = ref(TRADER_MAGIC_LEVEL_DEFAULT);
  const isUnique = ref(false);
  const isGrouped = ref(true);
  const isMaxPrice = ref(false);

  const sources = computed(() => options.value?.sources ?? []);

  const chosenSource = ref<string>();

  // Пока книгу не выбрали, цены по первой, как в старом SPA
  const priceSource = computed(
    () => chosenSource.value ?? sources.value[0]?.shortName,
  );

  const magicLevelItems = computed(() =>
    (options.value?.magicLevels ?? []).map((item) => ({
      label: item.name,
      value: item.value,
    })),
  );

  const isGroupingDisabled = computed(() => isUnique.value);

  const isMaxPriceDisabled = computed(() => isUnique.value || !isGrouped.value);

  const { results, isPending, generate, clear } = useToolGenerator(
    async (signal) => {
      const body: TraderRequest = {
        magicLevel: magicLevel.value,
        persuasion: Math.max(
          persuasion.value ?? TRADER_PERSUASION_MIN,
          TRADER_PERSUASION_MIN,
        ),
        unique: isUnique.value,
      };

      return [
        traderResultSchema.parse(
          await $fetch(TOOLS_API_URL.trader, {
            method: 'POST',
            body,
            signal,
          }),
        ),
      ];
    },
    { isReplacing: true },
  );

  const hasResults = computed(() => results.value.length > 0);

  const groups = computed(() =>
    groupLoot(
      results.value[0]?.value ?? [],
      (item) => getTraderPrice(item, priceSource.value),
      {
        isGrouped: isGrouped.value && !isUnique.value,
        isMaxPrice: isMaxPrice.value,
      },
    ),
  );
</script>

<template>
  <ToolGenerator
    :title="TRADER_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <UFormField :label="TRADER_TEXT.persuasion">
        <UInputNumber
          v-model="persuasion"
          :min="TRADER_PERSUASION_MIN"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="TRADER_TEXT.magicLevel">
        <USelect
          v-model="magicLevel"
          :items="magicLevelItems"
          class="w-full"
        />
      </UFormField>

      <UFormField
        v-if="sources.length"
        :label="TRADER_TEXT.priceSource"
      >
        <div class="flex flex-wrap gap-2">
          <UTooltip
            v-for="source in sources"
            :key="source.shortName"
            :text="source.name"
          >
            <ToolChip
              :label="source.shortName"
              :is-selected="priceSource === source.shortName"
              @toggle="chosenSource = source.shortName"
            />
          </UTooltip>
        </div>
      </UFormField>

      <div class="flex flex-col gap-2">
        <UCheckbox
          v-model="isUnique"
          :label="LOOT_TEXT.unique"
        />

        <UCheckbox
          v-model="isGrouped"
          :label="LOOT_TEXT.grouping"
          :disabled="isGroupingDisabled"
        />

        <UCheckbox
          v-model="isMaxPrice"
          :label="LOOT_TEXT.maxPrice"
          :disabled="isMaxPriceDisabled"
        />
      </div>
    </template>

    <LootMagicItems
      v-if="groups.length"
      :title="TRADER_TEXT.items"
      :groups="groups"
    />

    <p
      v-else
      class="py-8 text-center text-muted"
    >
      {{ TRADER_TEXT.empty }}
    </p>
  </ToolGenerator>
</template>
