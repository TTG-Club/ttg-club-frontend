<script setup lang="ts">
  import type { AbilityMethod, AbilityScores } from '~tools/model';

  import { clamp } from 'es-toolkit';

  import {
    AbilityPointBuy,
    AbilityRandom,
    AbilityStandard,
    AbilityTable,
  } from '~tools/ability-calc';
  import { ABILITY_CALC_TEXT, ABILITY_METHODS } from '~tools/model';

  import { useCharacterSheet } from '../composables';
  import {
    ABILITY_KEYS,
    ABILITY_LABELS,
    ABILITY_SCORE,
    ABILITY_SCORES_TEXT,
    formatModifier,
    getSheetAbilityIncreases,
  } from '../model';

  /**
   * Набор характеристик, как на new.ttg.club: способы калькулятора
   * характеристик (случайный, «покупка», стандартный набор) прямо в листе.
   * Прибавки расы, черт и повышений уже входят в значения листа, поэтому
   * идут в набор бонусами; по «Записать в лист» набор заменяет значения.
   */
  const isOpen = defineModel<boolean>('open', { default: false });

  const { document, update } = useCharacterSheet();

  const method = ref<AbilityMethod>(ABILITY_METHODS[0].value);
  const random = ref<AbilityScores>({});
  const pointBuy = ref<AbilityScores>({});
  const standard = ref<AbilityScores>({});

  const methodItems = ABILITY_METHODS.map((item) => ({
    label: item.label,
    value: item.value,
    slot: item.value,
  }));

  const increases = computed(() => getSheetAbilityIncreases(document.value));

  const bonuses = computed<AbilityScores>(() => ({ ...increases.value.total }));

  const scores = computed(() => {
    if (method.value === 'pointBuy') {
      return pointBuy.value;
    }

    return method.value === 'standard' ? standard.value : random.value;
  });

  const currentScores = computed(() =>
    ABILITY_KEYS.map((key) => ({
      key,
      label: ABILITY_LABELS[key].short,
      score: document.value.abilities[key],
    })),
  );

  /** Откуда прибавки: «Тифлинг: Хар +2, Инт +1». */
  const increasesHint = computed(() =>
    increases.value.sources
      .map((source) => {
        const parts = ABILITY_KEYS.flatMap((key) => {
          const value = source.increases[key];

          return value
            ? [`${ABILITY_LABELS[key].short} ${formatModifier(value)}`]
            : [];
        });

        return `${source.name}: ${parts.join(', ')}`;
      })
      .join('; '),
  );

  const isIncomplete = computed(() =>
    ABILITY_KEYS.some((key) => (scores.value[key] ?? 0) <= 0),
  );

  function apply(): void {
    if (isIncomplete.value) {
      return;
    }

    const next = { ...document.value.abilities };

    for (const key of ABILITY_KEYS) {
      next[key] = clamp(
        (scores.value[key] ?? ABILITY_SCORE.default)
          + (increases.value.total[key] ?? 0),
        ABILITY_SCORE.min,
        ABILITY_SCORE.max,
      );
    }

    update((current) => ({ ...current, abilities: next }));

    isOpen.value = false;
  }

  function cancel(): void {
    isOpen.value = false;
  }
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="ABILITY_SCORES_TEXT.title"
    :description="ABILITY_SCORES_TEXT.description"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span class="text-dimmed">{{ ABILITY_SCORES_TEXT.current }}:</span>

          <span
            v-for="ability in currentScores"
            :key="ability.key"
            class="text-toned uppercase"
          >
            {{ ability.label }}

            <span class="font-bold text-highlighted">{{ ability.score }}</span>
          </span>
        </div>

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

        <div class="flex flex-col gap-1 text-xs text-dimmed">
          <p>{{ ABILITY_SCORES_TEXT.replaceHint }}</p>

          <p v-if="increasesHint">
            {{ ABILITY_SCORES_TEXT.bonusesHint }} {{ increasesHint }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <span
          v-if="isIncomplete"
          class="mr-auto text-xs text-dimmed"
        >
          {{ ABILITY_SCORES_TEXT.incompleteHint }}
        </span>

        <UButton
          :label="ABILITY_SCORES_TEXT.cancel"
          color="neutral"
          variant="ghost"
          @click.left.exact.prevent="cancel"
        />

        <UButton
          :label="ABILITY_SCORES_TEXT.apply"
          :disabled="isIncomplete"
          @click.left.exact.prevent="apply"
        />
      </div>
    </template>
  </UModal>
</template>
