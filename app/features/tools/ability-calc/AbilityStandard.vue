<script setup lang="ts">
  import type { AbilityKey, AbilityScores } from '../model';

  import {
    ABILITIES,
    ABILITY_STANDARD_ARRAY,
    buildAssignedScores,
  } from '../model';
  import AbilityAssign from './AbilityAssign.vue';

  /** Стандартный набор 15, 14, 13, 12, 10, 8 по характеристикам. */
  const scores = defineModel<AbilityScores>({ required: true });

  const keys = ref<Array<AbilityKey | undefined>>(
    ABILITIES.map(() => undefined),
  );

  watch(
    keys,
    () => {
      scores.value = buildAssignedScores(ABILITY_STANDARD_ARRAY, keys.value);
    },
    { immediate: true },
  );
</script>

<template>
  <AbilityAssign
    v-model="keys"
    :values="ABILITY_STANDARD_ARRAY"
  />
</template>
