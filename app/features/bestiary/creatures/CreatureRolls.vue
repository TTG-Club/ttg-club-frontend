<script setup lang="ts">
  import type { CreatureRoll } from '../model';

  import { DiceRoller } from '~dice-roller/roller';

  import { LIST_SEPARATOR } from '../model';
  import CreatureProperty from './CreatureProperty.vue';

  /** Спасброски или навыки существа: подпись и бросок к20 с бонусом. */
  const { label, rolls, source } = defineProps<{
    label: string;
    rolls: Array<CreatureRoll>;
    /** Имя существа для истории бросков. */
    source: string;
  }>();
</script>

<template>
  <CreatureProperty :label="label">
    <span
      v-for="(roll, index) in rolls"
      :key="roll.key"
    >
      <span class="mr-1">{{ roll.label }}</span>

      <DiceRoller
        :formula="roll.formula"
        :label="roll.rollLabel"
        :source="source"
        >{{ roll.value }}</DiceRoller
      >

      <template v-if="index < rolls.length - 1">{{ LIST_SEPARATOR }}</template>
    </span>
  </CreatureProperty>
</template>
