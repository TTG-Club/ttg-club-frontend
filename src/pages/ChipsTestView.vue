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
      :model-value="value"
      @click="onClick"
      >Label L</ui-chip
    >

    <ui-chip
      size="m"
      :model-value="value"
      @click="onClick"
      >Label M</ui-chip
    >

    <ui-chip
      size="s"
      :model-value="value"
      @click="onClick"
      >Label S</ui-chip
    >

    <ui-chip
      size="xs"
      :model-value="value"
      @click="onClick"
      >Label XS</ui-chip
    >
  </div>

  <div :class="$style.div">
    <ui-chip
      size="l"
      :model-value="value"
      color="secondary"
      @click="onClick"
      >Label L</ui-chip
    >

    <ui-chip
      size="m"
      color="secondary"
      :model-value="value"
      @click="onClick"
      >Label M</ui-chip
    >

    <ui-chip
      size="s"
      color="secondary"
      :model-value="value"
      @click="onClick"
      >Label S</ui-chip
    >

    <ui-chip
      size="xs"
      color="secondary"
      :model-value="value"
      @click="onClick"
      >Label XS</ui-chip
    >
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
      count="18"
      >Label XS</ui-chip
    >
  </div>

  <div :class="$style.div">
    <ui-chip
      size="l"
      :clickable="false"
      >Label L</ui-chip
    >

    <ui-chip
      size="m"
      :clickable="false"
      >Label M</ui-chip
    >

    <ui-chip
      size="s"
      :clickable="false"
      >Label S</ui-chip
    >

    <ui-chip
      size="xs"
      :clickable="false"
      >Label XS</ui-chip
    >
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  import UiChip from '@/shared/ui/kit/chip/UiChip.vue';

  const value = ref(false);

  const onClick = () => {
    value.value = !value.value;
  };
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
