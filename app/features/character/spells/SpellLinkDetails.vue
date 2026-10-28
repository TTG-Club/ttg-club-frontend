<script setup lang="ts">
  import type { SpellLink } from '../model';

  import {
    SPELL_COMPONENT_EMPTY,
    SPELL_COMPONENTS,
    SPELL_TEXT,
  } from '../model';

  /**
   * Вторая строка заклинания в списке: концентрация и ритуал, школа и
   * буквы компонентов (точка — компонента нет).
   */
  const { spell } = defineProps<{
    spell: SpellLink;
  }>();

  const components = computed(() =>
    SPELL_COMPONENTS.map((component) => {
      const isPresent = Boolean(spell.components?.[component.key]);

      return {
        key: component.key,
        label: isPresent ? component.short : SPELL_COMPONENT_EMPTY,
        hint: isPresent ? component.name : undefined,
      };
    }),
  );

  const markClass =
    'rounded-md border border-default bg-elevated px-1.5 text-xs leading-normal text-default';
</script>

<template>
  <span class="flex min-w-0 shrink-0 items-center gap-2">
    <UTooltip
      v-if="spell.concentration"
      :text="SPELL_TEXT.concentrationHint"
    >
      <span :class="markClass">{{ SPELL_TEXT.concentrationShort }}</span>
    </UTooltip>

    <UTooltip
      v-if="spell.ritual"
      :text="SPELL_TEXT.ritualHint"
    >
      <span :class="markClass">{{ SPELL_TEXT.ritualShort }}</span>
    </UTooltip>

    <span class="max-w-40 truncate first-letter:uppercase">
      {{ spell.school }}
    </span>

    <span class="flex gap-1 text-default">
      <UTooltip
        v-for="component in components"
        :key="component.key"
        :text="component.hint"
        :disabled="!component.hint"
      >
        <span class="w-3 text-center">{{ component.label }}</span>
      </UTooltip>
    </span>
  </span>
</template>
