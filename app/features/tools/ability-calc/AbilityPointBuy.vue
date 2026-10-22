<script setup lang="ts">
  import type { AbilityKey, AbilityScores } from '../model';

  import {
    ABILITIES,
    ABILITY_CALC_TEXT,
    getPointBuyItems,
    getPointBuySpent,
    POINT_BUY_MAX,
    POINT_BUY_MIN_SCORE,
    TOOLS_ICON,
  } from '../model';

  /**
   * «Покупка» значений: 27 очков, значения от 8 до 15. У каждого варианта
   * видно, сколько очков он добавит или вернёт.
   */
  const scores = defineModel<AbilityScores>({ required: true });

  /** Все характеристики по 8: с этого «покупка» начинается. */
  function getInitial(): AbilityScores {
    return Object.fromEntries(
      ABILITIES.map((ability) => [ability.key, POINT_BUY_MIN_SCORE]),
    );
  }

  const values = ref<AbilityScores>(getInitial());

  const left = computed(() => POINT_BUY_MAX - getPointBuySpent(values.value));

  /**
   * Варианты значения для характеристики.
   * @param key - характеристика
   */
  function getItems(key: AbilityKey) {
    return getPointBuyItems(values.value, key);
  }

  /**
   * Меняет значение характеристики.
   * @param key - характеристика
   * @param value - новое значение
   */
  function setValue(key: AbilityKey, value: number): void {
    values.value = { ...values.value, [key]: value };
  }

  function reset(): void {
    values.value = getInitial();
  }

  watch(
    values,
    (value) => {
      scores.value = value;
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :label="ABILITY_CALC_TEXT.reset"
        :icon="TOOLS_ICON.reset"
        color="neutral"
        variant="subtle"
        @click.left.exact.prevent="reset"
      />

      <span class="text-muted">
        {{ ABILITY_CALC_TEXT.points }}:
        <span class="text-highlighted">{{ left }} / {{ POINT_BUY_MAX }}</span>
      </span>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <UFieldGroup
        v-for="ability in ABILITIES"
        :key="ability.key"
        class="w-full"
      >
        <UBadge
          :label="ability.short"
          color="neutral"
          variant="subtle"
          size="lg"
          class="w-14 shrink-0 justify-center uppercase"
        />

        <USelect
          :model-value="values[ability.key]"
          :items="getItems(ability.key)"
          :placeholder="ABILITY_CALC_TEXT.valuePlaceholder"
          :aria-label="ability.name"
          class="w-full"
          @update:model-value="setValue(ability.key, $event)"
        />
      </UFieldGroup>
    </div>
  </div>
</template>
