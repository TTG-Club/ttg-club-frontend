<script setup lang="ts">
  import { CREATURE_TEXT } from '../model';

  /** Уровень опасности слева от строки списка. */
  const { rating } = defineProps<{
    rating: string;
  }>();
</script>

<template>
  <UTooltip :text="CREATURE_TEXT.ratingHint">
    <span
      class="-ml-1 flex size-10 shrink-0 items-center justify-center border-r border-default pr-2 text-lg text-default"
    >
      {{ rating }}
    </span>
  </UTooltip>
</template>
