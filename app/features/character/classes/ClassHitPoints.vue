<script setup lang="ts">
  import { DiceRoller } from '~dice-roller/roller';

  import { CLASS_TEXT, getClassHitPoints } from '../model';

  /**
   * Хиты класса карточкой рядом с обложкой: кость хитов, хиты на первом
   * и на следующих уровнях.
   */
  const { diceHp } = defineProps<{
    /** Грани кости хитов, например 8 для к8. */
    diceHp: number;
  }>();

  const hitPoints = computed(() => getClassHitPoints(diceHp));
</script>

<template>
  <section
    class="flex w-full flex-col gap-2 self-start rounded-lg border border-default bg-muted px-4 py-3 text-sm"
  >
    <h3 class="text-base font-medium text-highlighted">
      {{ CLASS_TEXT.hitPoints }}
    </h3>

    <p>
      <b class="mr-1">{{ CLASS_TEXT.hitDice }}</b>

      <DiceRoller :formula="hitPoints.formula" />

      {{ CLASS_TEXT.perLevel }}
    </p>

    <p>
      <b>{{ CLASS_TEXT.firstLevel }}</b>

      {{ diceHp }} {{ CLASS_TEXT.firstLevelModifier }}

      <strong>{{ CLASS_TEXT.constitution }}</strong>
    </p>

    <p>
      <b class="mr-1">{{ CLASS_TEXT.nextLevels }}</b>

      <DiceRoller :formula="hitPoints.formula" />

      ({{ CLASS_TEXT.or }} {{ hitPoints.average }})
      {{ CLASS_TEXT.nextLevelsModifier }}

      <strong>{{ CLASS_TEXT.constitution }}</strong>

      {{ CLASS_TEXT.nextLevelsSuffix }}
    </p>
  </section>
</template>
