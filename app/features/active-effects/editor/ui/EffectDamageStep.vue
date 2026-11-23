<script setup lang="ts">
  import type { ActiveEffect, EffectDamagePart } from '../../model';

  import { EFFECT_DAMAGE_STEP_LABELS } from '../../model';
  import EffectDamageParts from './EffectDamageParts.vue';

  /**
   * Шаг «Урон»: урон в момент срабатывания. Урон каждый ход — строка списка
   * «Срабатывания».
   */
  const effect = defineModel<ActiveEffect>('effect', { required: true });

  const triggerDamage = computed({
    get: () => effect.value.damageParts ?? [],
    set: (parts: EffectDamagePart[]) => {
      effect.value = {
        ...effect.value,
        damageParts: parts.length > 0 ? parts : undefined,
      };
    },
  });
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="text-xs font-medium text-default">
        {{ EFFECT_DAMAGE_STEP_LABELS.triggerTitle }}
      </span>

      <p class="text-xs text-muted">
        {{ EFFECT_DAMAGE_STEP_LABELS.triggerHint }}
      </p>
    </div>

    <EffectDamageParts v-model="triggerDamage" />
  </div>
</template>
