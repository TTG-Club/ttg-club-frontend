<script setup lang="ts">
  import type { AbilityKey, AbilityScores } from '../model';

  import { useDiceRoll } from '~dice-roller/composables';
  import { ROLL_TOAST_ICON } from '~dice-roller/model';

  import {
    ABILITIES,
    ABILITY_CALC_TEXT,
    ABILITY_ROLL_FORMULA,
    buildAssignedScores,
    TOOLS_ICON,
  } from '../model';
  import AbilityAssign from './AbilityAssign.vue';

  /**
   * Случайный набор: шесть бросков 4к6 без худшего кубика, от большего к
   * меньшему, и каждому назначается характеристика.
   */
  const scores = defineModel<AbilityScores>({ required: true });

  const { roll } = useDiceRoll();

  const toast = useToast();

  const values = ref<Array<number | undefined>>(ABILITIES.map(() => undefined));

  const keys = ref<Array<AbilityKey | undefined>>(
    ABILITIES.map(() => undefined),
  );

  const sum = computed(() =>
    values.value.reduce<number>((total, value) => total + (value ?? 0), 0),
  );

  const isRolled = computed(() => sum.value > 0);

  const rollLabel = computed(() =>
    isRolled.value ? ABILITY_CALC_TEXT.reroll : ABILITY_CALC_TEXT.roll,
  );

  /** Бросает все шесть значений заново и снимает назначения. */
  function rollAll(): void {
    const rolled = ABILITIES.map(
      (_, index) =>
        roll({
          formula: ABILITY_ROLL_FORMULA,
          label: `${ABILITY_CALC_TEXT.rollLabel}${index + 1}`,
          source: ABILITY_CALC_TEXT.source,
          isQuiet: true,
        })?.value,
    );

    if (rolled.includes(undefined)) {
      return;
    }

    values.value = rolled.toSorted((a, b) => (b ?? 0) - (a ?? 0));
    keys.value = ABILITIES.map(() => undefined);

    // Шесть бросков — одно уведомление, подробности в истории бросков
    toast.add({
      title: `${ABILITY_CALC_TEXT.rolled}: ${values.value.join(', ')}`,
      description: ABILITY_CALC_TEXT.source,
      icon: ROLL_TOAST_ICON,
      color: 'neutral',
    });
  }

  watch(
    [values, keys],
    () => {
      scores.value = buildAssignedScores(values.value, keys.value);
    },
    { immediate: true },
  );
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :label="rollLabel"
        :icon="TOOLS_ICON.generate"
        @click.left.exact.prevent="rollAll"
      />

      <span class="text-muted">
        {{ ABILITY_CALC_TEXT.sum }}:
        <span class="text-highlighted">{{ sum }}</span>
      </span>
    </div>

    <AbilityAssign
      v-model="keys"
      :values="values"
    />
  </div>
</template>
