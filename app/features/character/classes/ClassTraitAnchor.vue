<script setup lang="ts">
  import type { ClassTraitLink } from '../model';

  /**
   * Умение в таблице уровней: клик открывает его описание в дровере, как
   * на new.ttg.club.
   */
  const { traitLink } = defineProps<{
    traitLink: ClassTraitLink;
  }>();

  const emit = defineEmits<{
    select: [anchor: string];
  }>();

  const linkClass = computed(() =>
    traitLink.archetypeFeature ? 'archetype_feet' : undefined,
  );

  function select() {
    emit('select', traitLink.anchor);
  }
</script>

<template>
  <a
    :href="traitLink.anchor"
    :class="linkClass"
    @click.left.exact.prevent="select"
    >{{ traitLink.name }}</a
  >
</template>
