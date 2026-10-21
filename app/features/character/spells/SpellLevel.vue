<script setup lang="ts">
  import { SPELL_TEXT } from '../model';

  /** Круг заклинания слева от строки списка; у заговора — полукруг. */
  const { level } = defineProps<{
    level: number;
  }>();

  const label = computed(() =>
    level ? String(level) : SPELL_TEXT.cantripMark,
  );

  const hint = computed(() =>
    level ? `${level} ${SPELL_TEXT.levelHint}` : SPELL_TEXT.cantrip,
  );
</script>

<template>
  <UTooltip :text="hint">
    <span
      class="-ml-1 flex size-10 shrink-0 items-center justify-center border-r border-default pr-2 text-lg text-default"
    >
      {{ label }}
    </span>
  </UTooltip>
</template>
