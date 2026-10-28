<script setup lang="ts">
  import type { Treasure } from '~inventory/model';

  import type { TreasuryKind, TreasuryRequest } from '../model';

  import { useToolGenerator } from '../composables';
  import { ToolGenerator } from '../generator';
  import { LootMagicItems, LootSection, LootTreasureTile } from '../loot';
  import {
    getTreasuryCoins,
    groupLoot,
    LOOT_TEXT,
    TOOLS_API_URL,
    TREASURY_COINS_GRID_CLASS,
    TREASURY_CR_DEFAULT,
    TREASURY_CR_ITEMS,
    TREASURY_KINDS,
    TREASURY_TEXT,
    treasuryResultSchema,
  } from '../model';

  /**
   * Сокровищница по таблицам DMG: показатель опасности монстров и виды
   * добычи. Монеты, магические предметы и драгоценности идут своими
   * группами; новый клад заменяет прежний.
   */
  const crItems = [...TREASURY_CR_ITEMS];

  const cr = ref(TREASURY_CR_DEFAULT);

  const kinds = ref<Record<TreasuryKind, boolean>>({
    coins: true,
    magicItem: true,
    scroll: true,
    trinket: true,
    art: true,
    gem: true,
  });

  const isUnique = ref(true);
  const isGrouped = ref(true);
  const isMaxPrice = ref(false);

  const { results, isPending, generate, clear } = useToolGenerator(
    async (signal) => {
      const body: TreasuryRequest = {
        ...kinds.value,
        cr: cr.value,
        unique: isUnique.value,
      };

      return [
        treasuryResultSchema.parse(
          await $fetch(TOOLS_API_URL.treasury, {
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

  const treasury = computed(() => results.value[0]?.value);

  const view = computed(() => ({
    isGrouped: isGrouped.value,
    isMaxPrice: isMaxPrice.value,
  }));

  const coins = computed(() => {
    const value = treasury.value?.coins;

    return value ? getTreasuryCoins(value) : [];
  });

  // У магических предметов сокровищницы цену не показываем, как в старом SPA
  const magicItems = computed(() =>
    groupLoot(treasury.value?.magicItems ?? [], () => undefined, view.value),
  );

  const treasureGroups = computed(() =>
    [
      { key: 'gems', title: TREASURY_TEXT.gems, items: treasury.value?.gems },
      { key: 'arts', title: TREASURY_TEXT.arts, items: treasury.value?.arts },
      {
        key: 'trinkets',
        title: TREASURY_TEXT.trinkets,
        items: treasury.value?.trinkets,
      },
    ].flatMap(({ items, ...rest }) =>
      items?.length
        ? [
            {
              ...rest,
              groups: groupLoot(
                items,
                (item: Treasure) => item.price ?? undefined,
                view.value,
              ),
            },
          ]
        : [],
    ),
  );

  const isEmpty = computed(
    () =>
      !coins.value.length
      && !magicItems.value.length
      && !treasureGroups.value.length,
  );

  const isMaxPriceDisabled = computed(() => !isGrouped.value);
</script>

<template>
  <ToolGenerator
    :title="TREASURY_TEXT.title"
    :is-pending="isPending"
    :has-results="hasResults"
    @generate="generate"
    @clear="clear"
  >
    <template #form>
      <UFormField :label="TREASURY_TEXT.cr">
        <USelect
          v-model="cr"
          :items="crItems"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="TREASURY_TEXT.contents">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <UCheckbox
            v-for="kind in TREASURY_KINDS"
            :key="kind.key"
            v-model="kinds[kind.key]"
            :label="kind.label"
          />
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
        />

        <UCheckbox
          v-model="isMaxPrice"
          :label="LOOT_TEXT.maxPrice"
          :disabled="isMaxPriceDisabled"
        />
      </div>
    </template>

    <LootSection
      v-if="coins.length"
      :title="TREASURY_TEXT.coins"
      :grid-class="TREASURY_COINS_GRID_CLASS"
    >
      <div
        v-for="coin in coins"
        :key="coin.key"
        class="rounded-xl border border-default bg-elevated/50 px-3 py-2 text-center text-highlighted"
      >
        {{ coin.label }}
      </div>
    </LootSection>

    <LootMagicItems
      v-if="magicItems.length"
      :title="TREASURY_TEXT.magicItems"
      :groups="magicItems"
    />

    <LootSection
      v-for="group in treasureGroups"
      :key="group.key"
      :title="group.title"
    >
      <LootTreasureTile
        v-for="(item, index) in group.groups"
        :key="`${item.item.name.rus}-${index}`"
        :group="item"
      />
    </LootSection>

    <p
      v-if="isEmpty"
      class="py-8 text-center text-muted"
    >
      {{ TREASURY_TEXT.empty }}
    </p>
  </ToolGenerator>
</template>
