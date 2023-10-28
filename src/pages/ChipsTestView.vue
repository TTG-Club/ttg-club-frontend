<template>
  <div :class="$style.div">
    <ui-chip size="l">Label L</ui-chip>

    <ui-chip size="m">Label M</ui-chip>

    <ui-chip size="s">Label S</ui-chip>

    <ui-chip size="xs">Label XS</ui-chip>
  </div>

  <div :class="$style.div">
    <ui-chip
      size="l"
      variant="rectangle"
      >Label L</ui-chip
    >

    <ui-chip
      size="m"
      variant="rectangle"
      >Label M</ui-chip
    >

    <ui-chip
      size="s"
      variant="rectangle"
      >Label S</ui-chip
    >

    <ui-chip
      size="xs"
      variant="rectangle"
      >Label XS</ui-chip
    >
  </div>
</template>

<script setup lang="ts">
  import UiChip from '@/shared/ui/kit/chip/UiChip.vue';
</script>

<style lang="scss" module>
  .div {
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
